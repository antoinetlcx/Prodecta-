import {
  DEFAULT_COMMERCIAL_TERMS,
  DEFAULT_CUSTOM_MODULE_PRICES,
  DEFAULT_SELECTED_MODULE_IDS,
  EXTERIOR_BRACKETS,
  MODULE_CATALOG,
  SECTORS,
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

function resolveModulePrice(module, context) {
  const customPrice = context.customModulePrices[module.id] || {};
  const base = {
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
    return base;
  }

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

  return {
    ...base,
    setupPublic: roundMoney(base.setupPublic),
    setupMinimum: roundMoney(base.setupMinimum),
    monthlyPublic: roundMoney(base.monthlyPublic),
    monthlyMinimum: roundMoney(base.monthlyMinimum),
  };
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

export function calculateQuote(input = {}) {
  const sectorKey = input.sectorKey || "hotel";
  const sector = SECTORS[sectorKey] || SECTORS.hotel;
  const terms = { ...DEFAULT_COMMERCIAL_TERMS, ...input };
  const selectedIds = new Set(input.selectedModuleIds?.length ? input.selectedModuleIds : DEFAULT_SELECTED_MODULE_IDS);
  const intSurface = clampNumber(input.surfaceInterior, 420);
  const extSurface = clampNumber(input.surfaceExterior, 1200);
  const estimatedPoints = Math.ceil(extSurface / 100);
  const points = input.manualPoints ? Math.ceil(clampNumber(input.pointsExterior, estimatedPoints)) : estimatedPoints;
  const unitPoint = exteriorUnitPrice(points);
  const minTier = findTier(sector.minimumTiers, intSurface);
  const publicTier = findTier(sector.publicTiers, intSurface);
  const customModulePrices = {
    ...DEFAULT_CUSTOM_MODULE_PRICES,
    ...(input.customModulePrices || {}),
  };

  const context = {
    sector,
    sectorKey,
    selectedIds,
    intSurface,
    extSurface,
    estimatedPoints,
    points,
    unitPoint,
    minTier,
    publicTier,
    customModulePrices,
  };

  const catalogModules = MODULE_CATALOG.map((module) => resolveModulePrice(module, context));
  const selectedModules = catalogModules.filter((module) => module.selected);
  const setupModules = selectedModules.filter((module) => module.setupPublic > 0 || module.setupMinimum > 0);
  const recurringModules = selectedModules.filter((module) => module.monthlyPublic > 0 || module.monthlyMinimum > 0);

  const setupPublicSubtotal = roundMoney(selectedModules.reduce((sum, module) => sum + module.setupPublic, 0));
  const setupMinimumSubtotal = roundMoney(selectedModules.reduce((sum, module) => sum + module.setupMinimum, 0));
  const monthlyPublicSubtotal = roundMoney(selectedModules.reduce((sum, module) => sum + module.monthlyPublic, 0));
  const monthlyMinimumSubtotal = roundMoney(selectedModules.reduce((sum, module) => sum + module.monthlyMinimum, 0));

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

  return {
    sectorKey,
    sector,
    intSurface,
    extSurface,
    estimatedPoints,
    points,
    unitPoint,
    minTier,
    publicTier,
    catalogModules,
    selectedModules,
    setupModules,
    recurringModules,
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
