export const formatMatchDate = (value) => {
  if (!value) return "";
  const plainDate = /^\d{4}-\d{2}-\d{2}$/;
  if (plainDate.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }
  return new Date(value).toLocaleDateString();
};
