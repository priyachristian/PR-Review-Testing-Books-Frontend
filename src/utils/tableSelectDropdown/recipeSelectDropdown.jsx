export const recipeSelectColumnHeader = { id: 'Recipe Code', name: 'Recipe Name' };

/** Map-only — keep call-site value/filter behavior unchanged. Code field is recipeId. */
export const buildRecipeSelectOptions = (recipeDrop = []) =>
  (recipeDrop || []).map(option => {
    const code = option?.recipeId || '-';
    const name = option?.name;

    return {
      value: option._id,
      label: name,
      columnId: code,
      columnName: name || '-',
      searchLabel: `${code} ${name || ''}`.replace(/\s+/g, ' ').trim(),
    };
  });
