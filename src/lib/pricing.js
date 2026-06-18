import {
  DEFAULT_COMMERCIAL_TERMS,
  DEFAULT_CUSTOM_MODULE_PRICES,
  DEFAULT_PROPERTY_MODULE_IDS,
  DEFAULT_SELECTED_MODULE_IDS,
  EXTERIOR_BRACKETS,
  GLOBAL_MODULE_IDS,
  MODULE_CATALOG,
  PROPERTY_MODULE_IDS,
  SECTORS,
  WORKFLOW_MODULE_GROUPS,
} from "../data/pricingConfig.js";
import { clampNumber, roundMoney } from "./formatters.js";

export function findTier(tiers, surface) {
  const normalized = Math.max(0, clampNumber(surface));
  return tiers.find((tier) => normalized >= tier.min && normalized <= tier.max) || tiers[tiers.length - 1];
}

export function exteriorUnitPrice(points) {
  const normalized = Math.max(0, Math.ceil(clampNumber(points)));
  if (normalized === 0) return 0;
  return EXTERIOR_BRACKETS.find((bracket) => normalized >= bracket.min && normalized <= bracket.max)?.price || 20;
}

function subscriptionDelta(values, fromIndex, toIndex) {
  const from = clampNumber(values[fromIndex]);
  const to = clampNumber(values[toIndex]);
  return Math.max(0, to - from);
}

function resolveMonthlyPrice(module, sector) {
  if (module.monthlyMode === "subscription-base") {
    return {
      public: clampNumber(sector.publicPlans[0]),
      minimum: clampNumber(sector.minimumPlans[0]),
    };
  }

  if (module.monthlyMode === "subscription-growth-delta") {
    return {
      public: subscriptionDelta(sector.publicPlans, 0, 1),
      minimum: subscriptionDelta(sector.minimumPlans, 0, 1),
    };
  }

  if (module.monthlyMode === "subscription-premium-delta") {
    return {
      public: subscriptionDelta(sector.publicPlans, 1, 2),
      minimum: subscriptionDelta(sector.minimumPlans, 1, 2),
    };
  }

  return {
    public: clampNumber(module.monthlyPublic),
    minimum: clampNumber(module.monthlyMinimum),
  };
}

function applyCustomPriceOverrides(base, customPrice = {}) {
  return ["setupPublic", "setupMinimum", "monthlyPublic", "monthlyMinimum"].reduce(
    (next, key) => ({
      ...next,
      [key]: customPrice[key] === undefined || customPrice[key] === "" ? next[key] : clampNumber(customPrice[key], next[key]),
    }),
    base,
  );
}

function resolveModulePrice(module, context) {
  const customPrice = context.customModulePrices[module.id] || {};
  let base = {
    ...module,
    selected: context.selectedIds.has(module.id),
    setupPublic: clampNumber(module.setupPublic),
    setupMinimum: clampNumber(module.setupMinimum),
    monthlyPublic: 0,
    monthlyMinimum: 0,
  };

  if (module.customPricing) {
    base.setupPublic = clampNumber(customPrice.setupPublic, module.setupPublic);
    base.setupMinimum = clampNumber(customPrice.setupMinimum, module.setupMinimum);
    base.monthlyPublic = clampNumber(customPrice.monthlyPublic, module.monthlyPublic || 0);
    base.monthlyMinimum = clampNumber(customPrice.monthlyMinimum, module.monthlyMinimum || 0);
  } else {
    if (module.setupMode === "interior-surface") {
      base.setupPublic = context.publicTier.coeff * context.intSurface;
      base.setupMinimum = context.minTier.coeff * context.intSurface;
    }

    if (module.setupMode === "sector-fixed") {
      base.setupPublic = context.sector.publicFixed;
      base.setupMinimum = context.sector.minimumFixed;
    }

    if (module.setupMode === "exterior-points") {
      base.setupPublic = context.points * context.unitPoint;
      base.setupMinimum = context.points * context.unitPoint;
    }

    const monthly = resolveMonthlyPrice(module, context.sector);
    base.monthlyPublic = monthly.public;
    base.monthlyMinimum = monthly.minimum;
  }

  base = applyCustomPriceOverrides(base, customPrice);

  return {
    ...base,
    setupPublic: roundMoney(base.setupPublic),
    setupMinimum: roundMoney(base.setupMinimum),
    monthlyPublic: roundMoney(base.monthlyPublic),
    monthlyMinimum: roundMoney(base.monthlyMinimum),
  };
}

export function createDefaultProperty(index = 1, overrides = {}) {
  return {
    id: overrides.id || `property-${index}`,
    name: overrides.name || `Bien ${index}`,
    surfaceInterior: overrides.surfaceInterior ?? 420,
    surfaceExterior: overrides.surfaceExterior ?? 0,
    manualPoints: overrides.manualPoints ?? false,
    pointsExterior: overrides.pointsExterior ?? 0,
    selectedModuleIds: overrides.selectedModuleIds ?? [...DEFAULT_PROPERTY_MODULE_IDS],
    customModulePrices: overrides.customModulePrices ?? {},
  };
}

export function createPropertyFromLegacyInput(input = {}) {
  const legacySelected = Array.isArray(input.selectedModuleIds)
    ? input.selectedModuleIds.filter((id) => PROPERTY_MODULE_IDS.includes(id))
    : DEFAULT_PROPERTY_MODULE_IDS;

  return createDefaultProperty(1, {
    name: input.propertyName || "Bien principal",
    surfaceInterior: input.surfaceInterior ?? 420,
    surfaceExterior: input.surfaceExterior ?? 1200,
    manualPoints: input.manualPoints ?? false,
    pointsExterior: input.pointsExterior ?? 12,
    selectedModuleIds: legacySelected,
  });
}

export function normalizeProperties(input = {}) {
  const source =
    Array.isArray(input.properties) && input.properties.length > 0
      ? input.properties
      : [createPropertyFromLegacyInput(input)];

  return source.map((property, index) => {
    const fallback = createDefaultProperty(index + 1);
    const selectedModuleIds = Array.isArray(property.selectedModuleIds)
      ? property.selectedModuleIds.filter((id) => PROPERTY_MODULE_IDS.includes(id))
      : [...DEFAULT_PROPERTY_MODULE_IDS];

    return {
      ...fallback,
      ...property,
      id: property.id || fallback.id,
      name: property.name || fallback.name,
      surfaceInterior: clampNumber(property.surfaceInterior, fallback.surfaceInterior),
      surfaceExterior: clampNumber(property.surfaceExterior, fallback.surfaceExterior),
      manualPoints: Boolean(property.manualPoints),
      pointsExterior: clampNumber(property.pointsExterior, fallback.pointsExterior),
      selectedModuleIds,
      customModulePrices: property.customModulePrices || {},
    };
  });
}

function buildPropertyQuote(property, context) {
  const intSurface = clampNumber(property.surfaceInterior, 420);
  const extSurface = clampNumber(property.surfaceExterior, 0);
  const estimatedPoints = Math.ceil(extSurface / 100);
  const points = property.manualPoints ? Math.ceil(clampNumber(property.pointsExterior, estimatedPoints)) : estimatedPoints;
  const unitPoint = exteriorUnitPrice(points);
  const minTier = findTier(context.sector.minimumTiers, intSurface);
  const publicTier = findTier(context.sector.publicTiers, intSurface);
  const selectedIds = new Set(property.selectedModuleIds || []);

  const propertyContext = {
    ...context,
    selectedIds,
    intSurface,
    extSurface,
    estimatedPoints,
    points,
    unitPoint,
    minTier,
    publicTier,
    customModulePrices: property.customModulePrices || {},
  };

  const modules = MODULE_CATALOG.filter((module) => PROPERTY_MODULE_IDS.includes(module.id)).map((module) =>
    resolveModulePrice(module, propertyContext),
  );
  const selectedModules = modules.filter((module) => module.selected);
  const lineItems = selectedModules.map((module) => ({
    ...module,
    id: `${property.id}:${module.id}`,
    moduleId: module.id,
    propertyId: property.id,
    propertyName: property.name,
    scope: "property",
    quantity: 1,
    unitSetupPublic: module.setupPublic,
    unitSetupMinimum: module.setupMinimum,
    unitMonthlyPublic: module.monthlyPublic,
    unitMonthlyMinimum: module.monthlyMinimum,
  }));
  const setupPublicSubtotal = roundMoney(lineItems.reduce((sum, module) => sum + module.setupPublic, 0));
  const setupMinimumSubtotal = roundMoney(lineItems.reduce((sum, module) => sum + module.setupMinimum, 0));
  const monthlyPublicSubtotal = roundMoney(lineItems.reduce((sum, module) => sum + module.monthlyPublic, 0));
  const monthlyMinimumSubtotal = roundMoney(lineItems.reduce((sum, module) => sum + module.monthlyMinimum, 0));

  return {
    property,
    intSurface,
    extSurface,
    estimatedPoints,
    points,
    unitPoint,
    minTier,
    publicTier,
    catalogModules: modules,
    selectedModules: lineItems,
    setupPublicSubtotal,
    setupMinimumSubtotal,
    monthlyPublicSubtotal,
    monthlyMinimumSubtotal,
    startupTotal: roundMoney(setupPublicSubtotal + monthlyPublicSubtotal),
  };
}

function aggregateLineItems(lineItems) {
  const groups = new Map();
  lineItems.forEach((line) => {
    const key = `${line.scope}:${line.moduleId || line.id}`;
    const current = groups.get(key) || {
      ...line,
      id: line.moduleId || line.id,
      quantity: 0,
      propertyNames: [],
      setupPublic: 0,
      setupMinimum: 0,
      monthlyPublic: 0,
      monthlyMinimum: 0,
    };

    current.quantity += line.quantity || 1;
    current.propertyNames = line.propertyName ? [...current.propertyNames, line.propertyName] : current.propertyNames;
    current.setupPublic = roundMoney(current.setupPublic + line.setupPublic);
    current.setupMinimum = roundMoney(current.setupMinimum + line.setupMinimum);
    current.monthlyPublic = roundMoney(current.monthlyPublic + line.monthlyPublic);
    current.monthlyMinimum = roundMoney(current.monthlyMinimum + line.monthlyMinimum);
    groups.set(key, current);
  });

  return Array.from(groups.values());
}

function calculateDiscount({ setupPublicSubtotal, setupMinimumSubtotal, discountType, discountPercent, discountFixed, marginMode }) {
  const maxDiscountEuro = Math.max(0, setupPublicSubtotal - setupMinimumSubtotal);
  const maxDiscountPct = setupPublicSubtotal > 0 ? (maxDiscountEuro / setupPublicSubtotal) * 100 : 0;
  const requestedDiscountEuro =
    discountType === "fixed"
      ? clampNumber(discountFixed)
      : setupPublicSubtotal * (clampNumber(discountPercent) / 100);

  const appliedDiscountEuro =
    marginMode === "force" ? requestedDiscountEuro : Math.min(requestedDiscountEuro, maxDiscountEuro);
  const appliedDiscountPct = setupPublicSubtotal > 0 ? (appliedDiscountEuro / setupPublicSubtotal) * 100 : 0;
  const requestedDiscountPct =
    discountType === "fixed"
      ? setupPublicSubtotal > 0
        ? (requestedDiscountEuro / setupPublicSubtotal) * 100
        : 0
      : clampNumber(discountPercent);

  return {
    maxDiscountEuro: roundMoney(maxDiscountEuro),
    maxDiscountPct,
    requestedDiscountEuro: roundMoney(requestedDiscountEuro),
    requestedDiscountPct,
    appliedDiscountEuro: roundMoney(appliedDiscountEuro),
    appliedDiscountPct,
    isCapped: marginMode !== "force" && requestedDiscountEuro > maxDiscountEuro,
  };
}

function idsForSegment(segmentKey) {
  if (segmentKey === "app") {
    return [...WORKFLOW_MODULE_GROUPS.app, ...WORKFLOW_MODULE_GROUPS.premium];
  }

  return WORKFLOW_MODULE_GROUPS[segmentKey] || [];
}

function sumSegment(lineItems, segmentKey) {
  const ids = idsForSegment(segmentKey);
  const items = lineItems.filter((line) => ids.includes(line.moduleId || line.id));

  return {
    key: segmentKey,
    lineItems: items,
    setupPublic: roundMoney(items.reduce((sum, line) => sum + line.setupPublic, 0)),
    setupMinimum: roundMoney(items.reduce((sum, line) => sum + line.setupMinimum, 0)),
    monthlyPublic: roundMoney(items.reduce((sum, line) => sum + line.monthlyPublic, 0)),
    monthlyMinimum: roundMoney(items.reduce((sum, line) => sum + line.monthlyMinimum, 0)),
  };
}

export function calculateQuote(input = {}) {
  const sectorKey = input.sectorKey || "hotel";
  const sector = SECTORS[sectorKey] || SECTORS.hotel;
  const terms = { ...DEFAULT_COMMERCIAL_TERMS, ...input };
  const selectedIds = new Set(
    (Array.isArray(input.selectedModuleIds) ? input.selectedModuleIds : DEFAULT_SELECTED_MODULE_IDS).filter((id) =>
      GLOBAL_MODULE_IDS.includes(id),
    ),
  );
  const properties = normalizeProperties(input);
  const customModulePrices = {
    ...DEFAULT_CUSTOM_MODULE_PRICES,
    ...(input.customModulePrices || {}),
  };

  const context = {
    sector,
    sectorKey,
    selectedIds,
    customModulePrices,
  };

  const propertyQuotes = properties.map((property) => buildPropertyQuote(property, context));
  const propertyLineItems = propertyQuotes.flatMap((propertyQuote) => propertyQuote.selectedModules);
  const globalCatalogModules = MODULE_CATALOG.filter((module) => GLOBAL_MODULE_IDS.includes(module.id)).map((module) =>
    resolveModulePrice(module, context),
  );
  const globalLineItems = globalCatalogModules
    .filter((module) => module.selected)
    .map((module) => ({
      ...module,
      moduleId: module.id,
      scope: "global",
      quantity: 1,
      unitSetupPublic: module.setupPublic,
      unitSetupMinimum: module.setupMinimum,
      unitMonthlyPublic: module.monthlyPublic,
      unitMonthlyMinimum: module.monthlyMinimum,
    }));
  const lineItems = [...propertyLineItems, ...globalLineItems];
  const selectedModules = aggregateLineItems(lineItems);
  const catalogModules = [...propertyQuotes.flatMap((propertyQuote) => propertyQuote.catalogModules), ...globalCatalogModules];
  const setupModules = selectedModules.filter((module) => module.setupPublic > 0 || module.setupMinimum > 0);
  const recurringModules = selectedModules.filter((module) => module.monthlyPublic > 0 || module.monthlyMinimum > 0);

  const setupPublicSubtotal = roundMoney(lineItems.reduce((sum, module) => sum + module.setupPublic, 0));
  const setupMinimumSubtotal = roundMoney(lineItems.reduce((sum, module) => sum + module.setupMinimum, 0));
  const monthlyPublicSubtotal = roundMoney(lineItems.reduce((sum, module) => sum + module.monthlyPublic, 0));
  const monthlyMinimumSubtotal = roundMoney(lineItems.reduce((sum, module) => sum + module.monthlyMinimum, 0));

  const discount = calculateDiscount({
    setupPublicSubtotal,
    setupMinimumSubtotal,
    discountType: terms.discountType,
    discountPercent: terms.discountPercent,
    discountFixed: terms.discountFixed,
    marginMode: terms.marginMode,
  });

  const setupFinalHT = roundMoney(setupPublicSubtotal - discount.appliedDiscountEuro);
  const monthlyFinalHT = monthlyPublicSubtotal;
  const startupTotalHT = roundMoney(setupFinalHT + monthlyFinalHT);
  const floorDelta = roundMoney(setupFinalHT - setupMinimumSubtotal);
  const isBelowFloor = setupFinalHT < setupMinimumSubtotal;
  const firstProperty = propertyQuotes[0] || buildPropertyQuote(createDefaultProperty(), context);
  const propertyCount = properties.length;
  const virtualVisitCount = propertyLineItems.filter((module) => module.moduleId === "interior-capture").length;
  const matterportSpaces = propertyLineItems.filter((module) => module.moduleId === "matterport-space").length;
  const webAppCount = propertyLineItems.filter((module) => module.moduleId === "web-app-immersive").length;
  const trackingCount = propertyLineItems.filter((module) => module.moduleId === "analytics-dashboard").length;
  const segments = {
    shooting: sumSegment(lineItems, "shooting"),
    app: sumSegment(lineItems, "app"),
    subscription: sumSegment(lineItems, "subscription"),
  };

  return {
    sectorKey,
    sector,
    properties,
    propertyQuotes,
    propertyCount,
    virtualVisitCount,
    matterportSpaces,
    webAppCount,
    trackingCount,
    intSurface: firstProperty.intSurface,
    extSurface: firstProperty.extSurface,
    estimatedPoints: firstProperty.estimatedPoints,
    points: firstProperty.points,
    unitPoint: firstProperty.unitPoint,
    minTier: firstProperty.minTier,
    publicTier: firstProperty.publicTier,
    catalogModules,
    globalCatalogModules,
    lineItems,
    selectedModules,
    setupModules,
    recurringModules,
    segments,
    setupPublicSubtotal,
    setupMinimumSubtotal,
    monthlyPublicSubtotal,
    monthlyMinimumSubtotal,
    discount,
    setupFinalHT,
    monthlyFinalHT,
    startupTotalHT,
    floorDelta,
    isBelowFloor,
  };
}
