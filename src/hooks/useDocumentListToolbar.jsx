import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Icons from 'assets/icons/icon';
import Toast from '@/components/ui/common/Toast';
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { buildExportRows, downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { clearAllFiltersFromLocalStorage } from '@/utils/filters';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { getQueryParams, parsedTableCoulmns } from '@/utils/services';

export const buildListExportPayload = () => getQueryParams(window.location.href) || {};

const useDocumentListToolbar = ({
  moduleName,
  resource,
  filterKey,
  columnConfigKey,
  configErrorMessage,
  exportConfig,
  columnsConfig,
  handleResetFilters,
  onRefresh,
  showPreferences = true,
  setIsLocked,
}) => {
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig, updateModuleConfig } = useModuleConfig();
  const configSaveAbortRef = useRef(null);
  const [moduleCodeConfig, setModuleCodeConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const {
    isOpen: isDocumentConfigOpen,
    handleOpen: handleOpenDocumentConfig,
    handleClose: handleCloseDocumentConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName,
    moduleConfig,
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveDocumentConfig,
    drawerSaveLoading: documentConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isDocumentConfigOpen,
    moduleConfig: moduleCodeConfig,
    setModuleConfig: setModuleCodeConfig,
    abortRef: configSaveAbortRef,
    onClose: handleCloseDocumentConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName,
        moduleConfig: {
          useCustomPrefix: number.autoGenerate,
          prefix: number.prefix,
          nextSequence: number.nextNumber,
          termsandConditions: terms,
        },
        signal,
      });
    },
    refreshModuleConfig: ({ signal }) =>
      getModuleConfig({
        moduleName,
        signal,
      }).catch(() => {}),
    errorMessage: configErrorMessage,
  });

  useEffect(() => {
    if (!isDocumentConfigOpen || !showPreferences || !moduleName) return;

    const controller = new AbortController();
    getModuleConfig({ moduleName, signal: controller.signal });
    return () => controller.abort();
  }, [isDocumentConfigOpen, showPreferences, moduleName, getModuleConfig]);

  useEffect(() => () => resetModuleConfig(), [resetModuleConfig]);

  useEffect(() => {
    if (moduleConfig) {
      setModuleCodeConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  const handleResetStoredPreferences = useCallback(() => {
    try {
      localStorage.removeItem(columnConfigKey);
      clearAllFiltersFromLocalStorage(filterKey);
      localStorage.removeItem(`${filterKey}_locked`);
    } catch (error) {
      console.error('Error clearing list preferences from localStorage:', error);
    }

    const defaultColumns = columnsConfig.getDefaultColumns();
    const defaultParsed = parsedTableCoulmns(null, defaultColumns);
    const defaultDisplayColumn = defaultParsed?.displayColumn?.filter(x => x?.visible === true);
    columnsConfig.setColumnsList(defaultParsed?.displayColumn);
    columnsConfig.setCustomizedColumns(defaultParsed?.customizedColumn?.length > 0 ? defaultParsed.customizedColumn : defaultDisplayColumn);

    handleResetFilters();
    setIsLocked?.(false);
  }, [columnConfigKey, columnsConfig, filterKey, handleResetFilters, setIsLocked]);

  const handleExport = useCallback(
    async exportOptions => {
      if (!exportConfig) return;

      const format = exportOptions?.format || 'xlsx';

      if (exportConfig.onExport) {
        try {
          await exportConfig.onExport(exportOptions);
          setExportModalOpen(false);
        } catch (error) {
          if (isCanceledRequestError(error)) return;
          Toast.error('Failed to export. Please try again.');
        }
        return;
      }

      if (format === 'pdf' || format === 'eInvoice' || format === 'eWayBill' || format === 'eInvoiceAndEWayBill') {
        if (!exportConfig.onPdfExport) {
          Toast.error('PDF export is not available.');
          return;
        }

        try {
          const result = await exportConfig.onPdfExport(exportOptions);
          if (result?.empty) {
            Toast.warning('No data available to export.');
            return;
          }
          // Browser download starts immediately — watch progress in Chrome downloads
          if (result?.background || result?.async) {
            Toast.info('Download started — open Chrome downloads to see progress. You can close this tab; the download should continue.');
            setExportModalOpen(false);
            return;
          }
          if (result?.completedWithErrors) {
            const skipped = result.skippedDocumentIds?.length || 0;
            Toast.warning(skipped ? `PDF exported with ${skipped} document(s) skipped.` : 'PDF exported with some errors.');
            setExportModalOpen(false);
            return;
          }
          if (result?.failed) {
            return;
          }
          setExportModalOpen(false);
        } catch (error) {
          if (isCanceledRequestError(error)) return;
          console.error('PDF export failed:', error);
          const message = typeof error === 'string' ? error : error?.message;
          Toast.error(message || 'Failed to export PDF. Please try again.');
        }
        return;
      }

      const controller = new AbortController();
      const payload = { ...buildListExportPayload(), signal: controller.signal };

      try {
        const response = await exportConfig.fetchExports(payload);
        const dataList = Array.isArray(response?.data) ? response.data : [];
        if (!dataList.length) {
          Toast.warning('No data available to export.');
          return;
        }

        const exportColumns = typeof exportConfig.getExportColumns === 'function' ? exportConfig.getExportColumns() : exportConfig.getExportColumns;
        const exportData = buildExportRows(dataList, exportColumns);
        const fileName = resolveExportFileName(exportOptions?.fileName, exportConfig.defaultFileName, 'xlsx');

        downloadExcelExport({
          exportData,
          sheetName: exportConfig.sheetName,
          fileName,
        });
        setExportModalOpen(false);
      } catch (error) {
        if (isCanceledRequestError(error)) return;
        Toast.error('Failed to export. Please try again.');
      }
    },
    [exportConfig]
  );

  const standardDropdownItems = useMemo(
    () => [
      ...(exportConfig
        ? [
            {
              type: 'group',
              label: 'EXPORT',
              children: [
                {
                  key: 'export',
                  label: exportConfig.exportLabel,
                  icon: <Icons.FileExcelOutlined />,
                  onClick: ({ domEvent }) => {
                    domEvent.stopPropagation();
                    setExportModalOpen(true);
                  },
                },
              ],
            },
            {
              type: 'divider',
            },
          ]
        : []),

      ...(showPreferences
        ? [
            {
              type: 'group',
              label: 'PREFERENCES',
              children: [
                {
                  key: 'preferences',
                  label: 'Preferences',
                  icon: <Icons.SettingOutlined />,
                  onClick: ({ domEvent }) => {
                    domEvent.stopPropagation();
                    handleOpenDocumentConfig();
                  },
                },
              ],
            },
            {
              type: 'divider',
            },
          ]
        : []),

      {
        type: 'group',
        label: 'ACTIONS',
        children: [
          {
            key: 'customColumns',
            label: 'Manage Custom Fields',
            icon: <Icons.EditOutlined />,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              setShowColumnModal(true);
            },
          },
          {
            key: 'refreshList',
            label: 'Refresh List',
            icon: <Icons.SyncOutlined />,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              onRefresh();
            },
          },
          {
            key: 'resetColumnsWidth',
            label: 'Reset Columns Width',
            icon: <Icons.ReloadOutlined />,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              handleResetStoredPreferences();
            },
          },
        ],
      },
    ],
    [exportConfig, handleOpenDocumentConfig, handleResetStoredPreferences, onRefresh, showPreferences]
  );

  const toolbarModalsProps = useMemo(
    () => ({
      resource,
      ...(showPreferences
        ? {
            documentConfig: {
              open: isDocumentConfigOpen,
              onClose: handleCloseDocumentConfig,
              onSave: handleSaveDocumentConfig,
              getTermsValue: getTermsAndConditionsValue,
              loading: documentConfigLoading || documentConfigSaving || moduleConfigLoading || (isDocumentConfigOpen && !moduleConfig),
              codeConfigValue: drawerCodeConfig,
              onCodeConfigChange: setDrawerCodeConfig,
              codeConfigDisabled: documentConfigSaving,
            },
          }
        : {}),
      ...(exportConfig
        ? {
            exportModal: {
              modalOpen: exportModalOpen,
              setModalOpen: open => {
                setExportModalOpen(open);
                if (!open && typeof exportConfig.onClearPdfProgress === 'function') {
                  exportConfig.onClearPdfProgress();
                }
              },
              entityPlural: exportConfig.entityPlural,
              defaultFileName: exportConfig.defaultFileName,
              exportLoading: exportConfig.exportLoading,
              exportProgress: exportConfig.exportProgress || null,
              onExport: handleExport,
              onRetryExport: exportConfig.onPdfExportRetry
                ? async options => {
                    try {
                      const result = await exportConfig.onPdfExportRetry(options);
                      if (result?.background || result?.async) {
                        Toast.info('Download started — check Chrome downloads for progress.');
                        setExportModalOpen(false);
                        return;
                      }
                      if (!result?.failed) setExportModalOpen(false);
                    } catch (error) {
                      if (isCanceledRequestError(error)) return;
                      Toast.error(typeof error === 'string' ? error : error?.message || 'Retry failed.');
                    }
                  }
                : null,
              formName: exportConfig.formName,
              formats: exportConfig.formats || ['xlsx'],
            },
          }
        : {}),
    }),
    [
      resource,
      isDocumentConfigOpen,
      handleCloseDocumentConfig,
      handleSaveDocumentConfig,
      getTermsAndConditionsValue,
      documentConfigLoading,
      documentConfigSaving,
      moduleConfigLoading,
      moduleConfig,
      drawerCodeConfig,
      setDrawerCodeConfig,
      exportModalOpen,
      exportConfig,
      handleExport,
      showPreferences,
    ]
  );

  return {
    showColumnModal,
    setShowColumnModal,
    standardDropdownItems,
    toolbarModalsProps,
  };
};

export default useDocumentListToolbar;
