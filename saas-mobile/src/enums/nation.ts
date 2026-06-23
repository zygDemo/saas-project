const NationConst = [
  { label: "汉族", value: "1", aliases: ["汉"] },
  { label: "回族", value: "2", aliases: ["回"] },
  { label: "满族", value: "3", aliases: ["满"] },
  { label: "藏族", value: "4", aliases: ["藏"] },
  { label: "阿昌族", value: "5", aliases: ["阿昌"] },
  { label: "白族", value: "6", aliases: ["白"] },
  { label: "保安族", value: "7", aliases: ["保安"] },
  { label: "布朗族", value: "8", aliases: ["布朗"] },
  { label: "布依族", value: "9", aliases: ["布依"] },
  { label: "朝鲜族", value: "10", aliases: ["朝鲜"] },
  { label: "达斡尔族", value: "11", aliases: ["达斡尔"] },
  { label: "傣族", value: "12", aliases: ["傣"] },
  { label: "德昂族", value: "13", aliases: ["德昂"] },
  { label: "侗族", value: "14", aliases: ["侗"] },
  { label: "东乡族", value: "15", aliases: ["东乡"] },
  { label: "独龙族", value: "16", aliases: ["独龙"] },
  { label: "鄂伦春族", value: "17", aliases: ["鄂伦春"] },
  { label: "俄罗斯族", value: "18", aliases: ["俄罗斯"] },
  { label: "鄂温克族", value: "19", aliases: ["鄂温克"] },
  { label: "高山族", value: "20", aliases: ["高山"] },
  { label: "仡佬族", value: "21", aliases: ["仡佬"] },
  { label: "哈尼族", value: "22", aliases: ["哈尼"] },
  { label: "哈萨克族", value: "23", aliases: ["哈萨克"] },
  { label: "赫哲族", value: "24", aliases: ["赫哲"] },
  { label: "基诺族", value: "25", aliases: ["基诺"] },
  { label: "京族", value: "26", aliases: ["京"] },
  { label: "景颇族", value: "27", aliases: ["景颇"] },
  { label: "柯尔克孜族", value: "28", aliases: ["柯尔克孜"] },
  { label: "拉祜族", value: "29", aliases: ["拉祜"] },
  { label: "黎族", value: "30", aliases: ["黎"] },
  { label: "傈僳族", value: "31", aliases: ["傈僳"] },
  { label: "珞巴族", value: "32", aliases: ["珞巴"] },
  { label: "毛南族", value: "33", aliases: ["毛南"] },
  { label: "门巴族", value: "34", aliases: ["门巴"] },
  { label: "蒙古族", value: "35", aliases: ["蒙古"] },
  { label: "苗族", value: "36", aliases: ["苗"] },
  { label: "仫佬族", value: "37", aliases: ["仫佬"] },
  { label: "纳西族", value: "38", aliases: ["纳西"] },
  { label: "怒族", value: "39", aliases: ["怒"] },
  { label: "普米族", value: "40", aliases: ["普米"] },
  { label: "羌族", value: "41", aliases: ["羌"] },
  { label: "撒拉族", value: "42", aliases: ["撒拉"] },
  { label: "畲族", value: "43", aliases: ["畲"] },
  { label: "水族", value: "44", aliases: ["水"] },
  { label: "塔吉克族", value: "45", aliases: ["塔吉克"] },
  { label: "塔塔尔族", value: "46", aliases: ["塔塔尔"] },
  { label: "土族", value: "47", aliases: ["土"] },
  { label: "佤族", value: "48", aliases: ["佤"] },
  { label: "锡伯族", value: "49", aliases: ["锡伯"] },
  { label: "乌兹别克族", value: "50", aliases: ["乌兹别克"] },
  { label: "瑶族", value: "51", aliases: ["瑶"] },
  { label: "彝族", value: "52", aliases: ["彝"] },
  { label: "裕固族", value: "53", aliases: ["裕固"] },
  { label: "维吾尔族", value: "54", aliases: ["维吾尔"] },
  { label: "壮族", value: "55", aliases: ["壮"] },
  { label: "土家族", value: "56", aliases: ["土家"] },
];

const normalizeNationText = (value: string): string => {
  return String(value || "")
    .trim()
    .replace(/^民族/, "")
    .replace(/[^\u4e00-\u9fff]/g, "")
    .replace(/^民族/, "")
    .replace(/族族/g, "族");
};

const getNationMatchKeys = (item: (typeof NationConst)[number]) => {
  return Array.from(
    new Set([item.label, ...(item.aliases || [])].map(normalizeNationText).filter(Boolean))
  ).sort((a, b) => b.length - a.length);
};

const nationLabelToValue = (label: string): string | undefined => {
  const raw = String(label || "").trim();
  if (!raw) return undefined;

  const valueItem = NationConst.find((n) => n.value === raw);
  if (valueItem) return valueItem.value;

  const normalized = normalizeNationText(raw);
  if (!normalized) return undefined;

  const normalizedWithZu = normalized.endsWith("族") ? normalized : `${normalized}族`;
  const matched = NationConst.map((item) => ({
    item,
    keys: getNationMatchKeys(item),
  }))
    .sort((a, b) => (b.keys[0]?.length || 0) - (a.keys[0]?.length || 0))
    .find(({ keys }) =>
      keys.some((key) => {
        const keyWithZu = key.endsWith("族") ? key : `${key}族`;
        return (
          normalized === key ||
          normalizedWithZu === keyWithZu ||
          normalized.startsWith(keyWithZu) ||
          normalized.startsWith(key)
        );
      })
    );

  return matched?.item.value;
};

const nationValueToLabel = (value: string): string | undefined => {
  if (!value) return undefined;
  const item = NationConst.find((n) => n.value === value);
  return item?.label;
};

export { nationLabelToValue, nationValueToLabel };
export default NationConst;
