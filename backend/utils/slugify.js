const slugify = (text, suffix = "") => {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return suffix ? `${base}-${suffix}` : base;
};

module.exports = slugify;
