export function getPagination(page = 1, pageSize = 20) {
  const take = pageSize;
  const skip = (page - 1) * pageSize;
  return { take, skip };
}


