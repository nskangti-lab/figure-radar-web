export type NamingInput = {
  workKr?: string;
  workJp?: string;
  workEn?: string;
  workSlug?: string;
  characterKr?: string;
  characterJp?: string;
  characterEn?: string;
  characterSlug?: string;
  manufacturerKr?: string;
  manufacturerJp?: string;
  manufacturerEn?: string;
  manufacturerSlug?: string;
  versionKr?: string;
  versionJp?: string;
  versionEn?: string;
  lineType?: string;
};

export type GeneratedNames = {
  displayNameKr: string;
  canonicalNameJp: string;
  displayNameEn: string;
  slug: string;
};

const lineTypeLabels: Record<string, { kr: string; en: string }> = {
  PRIZE_FIGURE: { kr: "\uacbd\ud488 \ud53c\uaddc\uc5b4", en: "Prize Figure" },
  SCALE_FIGURE: { kr: "\uc2a4\ucf00\uc77c \ud53c\uaddc\uc5b4", en: "Scale Figure" },
  NENDOROID: { kr: "\ub128\ub3c4\ub85c\uc774\ub4dc", en: "Nendoroid" },
  FIGMA: { kr: "figma", en: "figma" },
  POP_UP_PARADE: { kr: "POP UP PARADE", en: "POP UP PARADE" },
  ACTION_FIGURE: { kr: "\uc561\uc158 \ud53c\uaddc\uc5b4", en: "Action Figure" },
  PLASTIC_MODEL: { kr: "\ud504\ub77c\ubaa8\ub378", en: "Plastic Model" },
  GOODS: { kr: "\uad7f\uc988", en: "Goods" }
};

const lineTypeSlugs: Record<string, string> = {
  PRIZE_FIGURE: "prize",
  SCALE_FIGURE: "scale",
  NENDOROID: "nendoroid",
  FIGMA: "figma",
  POP_UP_PARADE: "pop-up-parade",
  ACTION_FIGURE: "action",
  PLASTIC_MODEL: "plastic-model",
  GOODS: "goods"
};

export function valueText(value: unknown) {
  return String(value ?? "").trim();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactJoin(parts: string[], separator = " ") {
  return parts.map(valueText).filter(Boolean).join(separator);
}

function lineTypeLabel(lineType: unknown, locale: "kr" | "en") {
  const key = valueText(lineType).toUpperCase();
  return lineTypeLabels[key]?.[locale] || valueText(lineType).replace(/_/g, " ");
}

function lineTypeSlug(lineType: unknown) {
  const key = valueText(lineType).toUpperCase();
  return lineTypeSlugs[key] || slugify(valueText(lineType));
}

function normalizeVersionForSlug(version: string) {
  return version
    .replace(/\s+(Ver\.?|ver\.?)$/i, "")
    .replace(/\s*(Version|version|\ubc84\uc804)$/i, "")
    .trim();
}

export function generateProductNames(input: NamingInput): GeneratedNames {
  const lineKr = lineTypeLabel(input.lineType, "kr");
  const lineEn = lineTypeLabel(input.lineType, "en");
  const workKr = valueText(input.workKr);
  const workJp = valueText(input.workJp) || workKr;
  const workEn = valueText(input.workEn) || valueText(input.workSlug) || workKr;
  const characterKr = valueText(input.characterKr);
  const characterJp = valueText(input.characterJp) || characterKr;
  const characterEn = valueText(input.characterEn) || valueText(input.characterSlug) || characterKr;
  const manufacturerKr = valueText(input.manufacturerKr);
  const manufacturerJp = valueText(input.manufacturerJp) || manufacturerKr;
  const manufacturerEn =
    valueText(input.manufacturerEn) || valueText(input.manufacturerSlug) || manufacturerKr;
  const versionKr = valueText(input.versionKr);
  const versionJp = valueText(input.versionJp);
  const versionEn = valueText(input.versionEn);

  const displayNameKr = `${workKr} - ${compactJoin([
    characterKr,
    versionKr,
    lineKr
  ])} - ${manufacturerKr}`;
  const canonicalNameJp = `${workJp} - ${compactJoin([
    characterJp,
    versionJp
  ])} - ${lineEn} - ${manufacturerJp}`;
  const displayNameEn = `${workEn} - ${compactJoin([
    characterEn,
    versionEn,
    lineEn
  ])} - ${manufacturerEn}`;
  const versionSlugSource = normalizeVersionForSlug(versionEn || versionKr);
  const slug = [
    input.workSlug || workEn,
    input.characterSlug || characterEn,
    versionSlugSource,
    lineTypeSlug(input.lineType),
    input.manufacturerSlug || manufacturerEn
  ]
    .map((part) => slugify(valueText(part)))
    .filter(Boolean)
    .join("-");

  return {
    displayNameKr,
    canonicalNameJp,
    displayNameEn,
    slug
  };
}
