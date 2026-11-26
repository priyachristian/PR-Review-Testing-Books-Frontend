export const itemGroupSelectColumnHeader = { id: 'Item Group ID', name: 'Item Group Name' };

export const buildItemGroupSelectOptions = (itemGroupDrop = []) =>
  (itemGroupDrop || []).map(option => {
    const code = option?.itemGroupId || '-';
    const name = option?.name;

    return {
      value: option?.id ?? option?._id,
      label: name,
      columnId: code,
      columnName: name || '-',
      searchLabel: `${code} ${name || ''}`.replace(/\s+/g, ' ').trim(),
    };
  });
