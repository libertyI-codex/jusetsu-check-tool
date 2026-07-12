(function () {
  "use strict";

  const SQM_PER_TSUBO = 3.305785;
  const YEN_PER_MAN = 10000;
  const ALLOWED_ROUNDING_UNITS = [10000, 100000, 500000, 1000000];

  function toFiniteNumber(value) {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      const normalizedValue = value.replaceAll(",", "").trim();

      if (normalizedValue === "") {
        return null;
      }

      value = normalizedValue;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return null;
    }

    return numberValue;
  }

  function toNonNegativeFiniteNumber(value) {
    const numberValue = toFiniteNumber(value);

    if (numberValue === null || numberValue < 0) {
      return null;
    }

    return numberValue;
  }

  function toPositiveFiniteNumber(value) {
    const numberValue = toFiniteNumber(value);

    if (numberValue === null || numberValue <= 0) {
      return null;
    }

    return numberValue;
  }

  function isValidMultiplier(value) {
    const numberValue = toFiniteNumber(value);
    return numberValue !== null && numberValue >= 0.5 && numberValue <= 3;
  }

  function isAllowedRoundingUnit(value) {
    const numberValue = toFiniteNumber(value);
    return numberValue !== null && ALLOWED_ROUNDING_UNITS.includes(numberValue);
  }

  function sqmToTsubo(squareMeters) {
    const numberValue = toNonNegativeFiniteNumber(squareMeters);

    if (numberValue === null) {
      return null;
    }

    return numberValue / SQM_PER_TSUBO;
  }

  function tsuboToSqm(tsubo) {
    const numberValue = toNonNegativeFiniteNumber(tsubo);

    if (numberValue === null) {
      return null;
    }

    return numberValue * SQM_PER_TSUBO;
  }

  function getValidNumbers(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map((value) => toFiniteNumber(value))
      .filter((value) => value !== null);
  }

  function calculateMedian(values) {
    const validNumbers = getValidNumbers(values).sort((a, b) => a - b);

    if (validNumbers.length === 0) {
      return null;
    }

    const centerIndex = Math.floor(validNumbers.length / 2);

    if (validNumbers.length % 2 === 1) {
      return validNumbers[centerIndex];
    }

    return (validNumbers[centerIndex - 1] + validNumbers[centerIndex]) / 2;
  }

  function calculateAverage(values) {
    const validNumbers = getValidNumbers(values);

    if (validNumbers.length === 0) {
      return null;
    }

    const total = validNumbers.reduce((sum, value) => sum + value, 0);

    return total / validNumbers.length;
  }

  function roundToUnit(value, unit) {
    const numberValue = toFiniteNumber(value);
    const unitValue = toFiniteNumber(unit);

    if (numberValue === null || unitValue === null || unitValue <= 0) {
      return null;
    }

    return Math.round(numberValue / unitValue) * unitValue;
  }

  // 路線価入力は千円/㎡、内部計算は円単位で扱います。
  function calculateRouteValueReference(input) {
    const routeValueThousandYen = toPositiveFiniteNumber(input?.routeValueThousandYen);
    const multiplier = toFiniteNumber(input?.multiplier);
    const landAreaSqm = toPositiveFiniteNumber(input?.landAreaSqm);
    const routeValueYenPerSqm = routeValueThousandYen === null
      ? null
      : routeValueThousandYen * 1000;

    if (routeValueYenPerSqm === null || !isValidMultiplier(multiplier)) {
      return {
        routeValueYenPerSqm,
        referenceYenPerSqm: null,
        referenceYenPerTsubo: null,
        referenceTotalYen: null
      };
    }

    const referenceYenPerSqm = routeValueYenPerSqm * multiplier;
    const referenceYenPerTsubo = referenceYenPerSqm * SQM_PER_TSUBO;
    const referenceTotalYen = landAreaSqm === null ? null : referenceYenPerSqm * landAreaSqm;

    return {
      routeValueYenPerSqm,
      referenceYenPerSqm,
      referenceYenPerTsubo,
      referenceTotalYen
    };
  }

  // 補正率は%単位です。enabled=trueの項目だけ単純加算します。
  function calculateAdjustmentTotal(adjustments) {
    const appliedAdjustments = [];
    const invalidAdjustments = [];

    if (!Array.isArray(adjustments)) {
      return {
        totalRatePercent: 0,
        appliedAdjustments,
        invalidAdjustments,
        warning: "個別補正データの形式が正しくありません。"
      };
    }

    adjustments.forEach((adjustment) => {
      if (!adjustment || adjustment.enabled !== true) {
        return;
      }

      const rate = toFiniteNumber(adjustment.rate);
      const copiedAdjustment = {
        id: adjustment.id,
        name: adjustment.name,
        enabled: true,
        rate,
        reason: typeof adjustment.reason === "string" ? adjustment.reason : ""
      };

      if (rate === null) {
        invalidAdjustments.push({
          ...copiedAdjustment,
          rate: adjustment.rate
        });
        return;
      }

      appliedAdjustments.push(copiedAdjustment);
    });

    const totalRatePercent = appliedAdjustments.reduce((sum, adjustment) => {
      return sum + adjustment.rate;
    }, 0);
    const warning = totalRatePercent > 50 || totalRatePercent < -50
      ? "個別補正の合計が±50％を超えています。入力内容を確認してください。"
      : "";

    return {
      totalRatePercent,
      appliedAdjustments,
      invalidAdjustments,
      warning
    };
  }

  // 引数の単価は円/坪、補正合計率は%です。
  function calculateAdjustedUnitPrice(initialUnitPricePerTsuboYen, totalRatePercent) {
    const unitPrice = toPositiveFiniteNumber(initialUnitPricePerTsuboYen);
    const rate = toFiniteNumber(totalRatePercent);

    if (unitPrice === null || rate === null) {
      return null;
    }

    return unitPrice * (1 + rate / 100);
  }

  // 入力単価は円/坪、土地面積は坪、返り値は円単位です。
  function calculateValuationPrices(input) {
    const initialUnitPricePerTsuboYen = toPositiveFiniteNumber(input?.initialUnitPricePerTsuboYen);
    const adjustedUnitPricePerTsuboYen = toPositiveFiniteNumber(input?.adjustedUnitPricePerTsuboYen);
    const landAreaTsubo = toPositiveFiniteNumber(input?.landAreaTsubo);
    const quickSaleFactor = input?.quickSaleFactor === undefined ? 0.95 : toFiniteNumber(input.quickSaleFactor);
    const listingFactor = input?.listingFactor === undefined ? 1.05 : toFiniteNumber(input.listingFactor);
    const roundingUnit = input?.roundingUnit === undefined ? 100000 : toFiniteNumber(input.roundingUnit);

    const emptyResult = {
      basePriceYen: null,
      adjustedPriceYen: null,
      centerPriceYen: null,
      quickSalePriceYen: null,
      listingPriceYen: null
    };

    if (
      initialUnitPricePerTsuboYen === null ||
      adjustedUnitPricePerTsuboYen === null ||
      landAreaTsubo === null ||
      quickSaleFactor === null || quickSaleFactor < 0.7 || quickSaleFactor > 1 ||
      listingFactor === null || listingFactor < 1 || listingFactor > 1.3 ||
      !isAllowedRoundingUnit(roundingUnit)
    ) {
      return emptyResult;
    }

    const basePriceYen = roundToUnit(initialUnitPricePerTsuboYen * landAreaTsubo, roundingUnit);
    const adjustedPriceYen = roundToUnit(adjustedUnitPricePerTsuboYen * landAreaTsubo, roundingUnit);
    const centerPriceYen = adjustedPriceYen;

    return {
      basePriceYen,
      adjustedPriceYen,
      centerPriceYen,
      quickSalePriceYen: roundToUnit(centerPriceYen * quickSaleFactor, roundingUnit),
      listingPriceYen: roundToUnit(centerPriceYen * listingFactor, roundingUnit)
    };
  }

  function formatCurrencyYen(value, fallback = "") {
    const numberValue = toFiniteNumber(value);

    if (numberValue === null) {
      return fallback;
    }

    return `${Math.round(numberValue).toLocaleString("ja-JP")}円`;
  }

  function formatManYen(value, fallback = "") {
    const numberValue = toFiniteNumber(value);

    if (numberValue === null) {
      return fallback;
    }

    const manYen = Math.round(numberValue / YEN_PER_MAN);
    return `${manYen.toLocaleString("ja-JP")}万円`;
  }

  function formatPercent(value) {
    const numberValue = toFiniteNumber(value);

    if (numberValue === null) {
      return "";
    }

    const sign = numberValue > 0 ? "+" : "";
    return `${sign}${numberValue}%`;
  }

  function generateCalculationMemo(input) {
    const sentences = [];
    const routeParts = [];
    const routeValue = toFiniteNumber(input?.routeValueThousandYen);
    const multiplier = toFiniteNumber(input?.routeValueMultiplier);
    const referenceYenPerTsubo = toFiniteNumber(input?.referenceYenPerTsubo);
    const initialUnitPricePerTsuboMan = toFiniteNumber(input?.initialUnitPricePerTsuboMan);
    const adjustedUnitPricePerTsuboYen = toFiniteNumber(input?.adjustedUnitPricePerTsuboYen);
    const adjustmentTotalPercent = toFiniteNumber(input?.adjustmentTotalPercent);
    const centerPriceYen = toFiniteNumber(input?.centerPriceYen);

    if (routeValue !== null) {
      const symbol = typeof input?.routeValueSymbol === "string" && input.routeValueSymbol.trim()
        ? input.routeValueSymbol.trim()
        : "";
      const year = typeof input?.routeValueYear === "string" || typeof input?.routeValueYear === "number"
        ? String(input.routeValueYear).trim()
        : "";
      routeParts.push(`路線価${routeValue.toLocaleString("ja-JP")}${symbol}千円／㎡`);

      if (year) {
        routeParts.push(`${year}年度`);
      }
    }

    if (multiplier !== null) {
      routeParts.push(`路線価倍率${multiplier}`);
    }

    if (referenceYenPerTsubo !== null) {
      routeParts.push(`参考坪単価約${formatManYen(referenceYenPerTsubo)}`);
    }

    if (routeParts.length > 0 && initialUnitPricePerTsuboMan !== null) {
      sentences.push(`本査定では、${routeParts.join("、")}を参考に、初期想定坪単価を${initialUnitPricePerTsuboMan.toLocaleString("ja-JP")}万円としました。`);
    } else if (initialUnitPricePerTsuboMan !== null) {
      sentences.push(`本査定では、初期想定坪単価を${initialUnitPricePerTsuboMan.toLocaleString("ja-JP")}万円としました。`);
    } else if (routeParts.length > 0) {
      sentences.push(`本査定では、${routeParts.join("、")}を参考値として確認しました。`);
    }

    if (typeof input?.initialUnitPriceReason === "string" && input.initialUnitPriceReason.trim()) {
      sentences.push(`初期想定単価の根拠は、${input.initialUnitPriceReason.trim()}です。`);
    }

    const appliedAdjustments = Array.isArray(input?.appliedAdjustments) ? input.appliedAdjustments : [];

    if (appliedAdjustments.length > 0) {
      const adjustmentText = appliedAdjustments
        .map((adjustment) => `${adjustment.name}${formatPercent(adjustment.rate)}`)
        .join("、");
      const adjustedUnitText = adjustedUnitPricePerTsuboYen === null
        ? ""
        : `、補正後坪単価を約${formatManYen(adjustedUnitPricePerTsuboYen)}`;
      const centerPriceText = centerPriceYen === null
        ? ""
        : `、査定中心価格を約${formatManYen(centerPriceYen)}`;

      sentences.push(`${adjustmentText}の個別補正を適用し、補正合計を${formatPercent(adjustmentTotalPercent)}${adjustedUnitText}${centerPriceText}としました。`);
    } else if (adjustedUnitPricePerTsuboYen !== null || centerPriceYen !== null) {
      const adjustedUnitText = adjustedUnitPricePerTsuboYen === null
        ? ""
        : `補正後坪単価を約${formatManYen(adjustedUnitPricePerTsuboYen)}`;
      const centerPriceText = centerPriceYen === null
        ? ""
        : `査定中心価格を約${formatManYen(centerPriceYen)}`;
      sentences.push(`${[adjustedUnitText, centerPriceText].filter(Boolean).join("、")}としました。`);
    }

    if (typeof input?.notice === "string" && input.notice.trim()) {
      sentences.push(input.notice.trim());
    }

    return sentences.join("\n");
  }

  window.ValuationEngine = Object.freeze({
    constants: Object.freeze({
      SQM_PER_TSUBO,
      ALLOWED_ROUNDING_UNITS: Object.freeze([...ALLOWED_ROUNDING_UNITS])
    }),
    sqmToTsubo,
    tsuboToSqm,
    calculateMedian,
    calculateAverage,
    roundToUnit,
    toFiniteNumber,
    calculateRouteValueReference,
    calculateAdjustmentTotal,
    calculateAdjustedUnitPrice,
    calculateValuationPrices,
    formatCurrencyYen,
    formatManYen,
    generateCalculationMemo
  });
}());