import StatTile from '@/components/dataDisplay/statCard/StatTile';
import Icons from 'assets/icons/icon';
import { COMPLAINT_BUCKET, COMPLAINT_STATUS_CARDS } from '../complaint.constants';

const CARD_ICONS = {
  [COMPLAINT_BUCKET.NEEDS_ACTION]: Icons.WarningOutlined,
  [COMPLAINT_BUCKET.GOING_ON]: Icons.SyncOutlined,
  [COMPLAINT_BUCKET.ON_HOLD]: Icons.ClockCircleOutlined,
  [COMPLAINT_BUCKET.FINISHED]: Icons.CheckCircleOutlined,
};

const ComplaintStatusCards = ({ counts, activeBucket, onChange }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {COMPLAINT_STATUS_CARDS.map(card => {
      const StatusIcon = CARD_ICONS[card.key];
      const isActive = activeBucket === card.key;
      const count = counts?.[card.countKey] ?? 0;

      return (
        <StatTile
          key={card.key}
          icon={StatusIcon ? <StatusIcon style={{ fontSize: 15 }} /> : null}
          label={card.label}
          value={count}
          selected={isActive}
          onClick={() => onChange(isActive ? null : card.key)}
        />
      );
    })}
  </div>
);

export default ComplaintStatusCards;
