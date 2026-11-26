export const priceListSelectColumnHeader = { id: 'Price List Code', name: 'Price List Name' };

/** Map-only — keep call-site value/filter behavior unchanged. Code field is priceListCode. */
export const buildPriceListSelectOptions = (priceListDrop = []) =>
  (priceListDrop || []).map(option => {
    const code = option?.priceListCode || '-';
    const name = option?.priceListName;

    return {
      value: option?.id ?? option?._id,
      label: name,
      columnId: code,
      columnName: name || '-',
      searchLabel: `${code} ${name || ''}`.replace(/\s+/g, ' ').trim(),
    };
  });
