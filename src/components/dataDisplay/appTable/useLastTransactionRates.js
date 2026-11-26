import { useEffect, useMemo, useRef, useState } from 'react';

import { itemMasterService } from '@/features/allMaster/item';
import { resolveDefaultTransactionType } from '@/features/allMaster/item/components/ItemTransactionsTab';
import { MODULE_TYPE } from '@/utils/constants';
import { isCanceledRequestError } from '@/utils/serviceHelper';

const cacheKey = (itemId, partyId, type) => `${itemId}|${partyId || ''}|${type}`;

const resolveItemId = item => {
  const ref = item?.itemId;
  if (ref == null || ref === '') return null;
  if (typeof ref === 'object') return String(ref.id || ref._id || '');
  return String(ref);
};

const useLastTransactionRates = ({ enabled = false, items = [], customerId, vendorId, pageType, page, moduleType, excludeDocumentId } = {}) => {
  const [ratesByItemId, setRatesByItemId] = useState({});
  const cacheRef = useRef(new Map());
  const prevContextRef = useRef('');

  const transactionType = useMemo(() => resolveDefaultTransactionType({ pageType, page, moduleType }), [pageType, page, moduleType]);

  const isPurchase = moduleType === MODULE_TYPE.PURCHASE;
  const partyId = isPurchase ? vendorId || '' : customerId || '';
  const contextKey = `${partyId}|${transactionType}|${excludeDocumentId || ''}`;

  const itemIds = useMemo(() => {
    const ids = new Set();
    (items || []).forEach(item => {
      const id = resolveItemId(item);
      if (id) ids.add(id);
    });
    return [...ids].sort();
  }, [items]);

  const itemIdsKey = itemIds.join(',');

  useEffect(() => {
    if (prevContextRef.current !== contextKey) {
      prevContextRef.current = contextKey;
      cacheRef.current.clear();
      setRatesByItemId({});
    }

    if (!enabled || !partyId || !itemIds.length) {
      if (!enabled || !partyId) setRatesByItemId({});
      return undefined;
    }

    let cancelled = false;
    const controllers = [];

    const load = async () => {
      const next = {};

      await Promise.all(
        itemIds.map(async itemId => {
          const key = cacheKey(itemId, partyId, transactionType);
          if (cacheRef.current.has(key)) {
            next[itemId] = cacheRef.current.get(key);
            return;
          }

          const controller = new AbortController();
          controllers.push(controller);

          try {
            const response = await itemMasterService.getItemTransactions({
              itemId,
              type: transactionType,
              customerId: !isPurchase && partyId ? partyId : '',
              vendorId: isPurchase && partyId ? partyId : '',
              page: 1,
              limit: 5,
              signal: controller.signal,
            });

            const rows = Array.isArray(response?.data) ? response.data : [];
            const match = rows.find(row => {
              if (!row || row.rate == null) return false;
              if (excludeDocumentId && String(row.id) === String(excludeDocumentId)) return false;
              return Number(row.rate) > 0;
            });

            const entry = match
              ? {
                  rate: Number(match.rate),
                  currencySymbol: match.currencySymbol || null,
                  documentId: match.id || null,
                }
              : null;

            cacheRef.current.set(key, entry);
            next[itemId] = entry;
          } catch (error) {
            if (!isCanceledRequestError(error)) {
              cacheRef.current.set(key, null);
              next[itemId] = null;
            }
          }
        })
      );

      if (!cancelled) {
        setRatesByItemId(prev => ({ ...prev, ...next }));
      }
    };

    load();

    return () => {
      cancelled = true;
      controllers.forEach(c => c.abort());
    };
    // itemIdsKey tracks the id list without depending on array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, itemIdsKey, contextKey, partyId, transactionType, isPurchase, excludeDocumentId]);

  return ratesByItemId;
};

export default useLastTransactionRates;
