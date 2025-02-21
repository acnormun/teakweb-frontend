const stringUtils = {
  capitalizeFirstLetter: (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),

  toUpperCase: (str: string) => str.toUpperCase(),

  toLowerCase: (str: string) => str.toLowerCase(),

  kebabCase: (str: string) => str.replace(/\s+/g, "-").toLowerCase(),

  snakeCase: (str: string) => str.replace(/\s+/g, "_").toLowerCase()
};

export default stringUtils;
