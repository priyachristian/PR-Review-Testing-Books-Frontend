import FilterInput from '@/components/forms/formInput/FilterInput';
import { APP_NAME_OPTIONS } from '@/utils/dropdownEnums';
import { filterInputEnum } from '@/utils/constants';

const CreatedFromFilter = ({ filter, setFilter, getPopupContainer, className = 'space-y-2' }) => (
  <div className={className}>
    <FilterInput
      type={filterInputEnum?.SELECT}
      name="appName"
      label="Created From"
      placeHolder="Select Created From"
      selectionOptions={APP_NAME_OPTIONS}
      value={filter?.appName}
      setFilter={setFilter}
      allowClear={true}
      getPopupContainer={getPopupContainer}
    />
  </div>
);

export default CreatedFromFilter;
