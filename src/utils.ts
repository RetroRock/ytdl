const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function replaceForbiddenCharacters(string: string, replaceWith: string) {
  return string.replace(/[/,\\,*,<,>,?,:,|]/g, replaceWith);
}
export { sleep, replaceForbiddenCharacters };
