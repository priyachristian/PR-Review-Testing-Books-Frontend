export const subItemGroupSelectColumnHeader = { id: 'Sub Item Group Number', name: 'Sub Item Group Name' };

export const buildSubItemGroupSelectOptions = (subItemGroupDrop = []) =>
  (subItemGroupDrop || []).map(option => {
    const code = option?.subItemGroupNo || option?.subItemGroupId || '-';
    const name = option?.name;

    return {
      value: option?.id ?? option?._id,
      label: name,
      columnId: code,
      columnName: name || '-',
      searchLabel: `${code} ${name || ''}`.replace(/\s+/g, ' ').trim(),
    };
  });
