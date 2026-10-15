/** plural(1, "product") -> "1 product";  plural(4, "category", "categories") -> "4 categories" */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;