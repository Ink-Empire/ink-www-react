import {
  List,
  Datagrid,
  TextField,
  DateField,
  FilterButton,
  TopToolbar,
  SearchInput,
  SelectInput,
  useRecordContext,
} from 'react-admin';
import { Alert, Tooltip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const channelChoices = [
  { id: 'mail', name: 'Email' },
  { id: 'database', name: 'In-app' },
  { id: 'fcm', name: 'Push' },
];

const notificationLogFilters = [
  <SearchInput source="q" alwaysOn key="search" placeholder="Name, email or notification" />,
  <SelectInput source="channel" choices={channelChoices} key="channel" />,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
  </TopToolbar>
);

// Datagrid reads source and label off its children for the column header, so
// these have to be accepted even though the components do not use them.
interface ColumnProps {
  source?: string;
  label?: string;
}

/**
 * The short class name, with the full namespace on hover so a notification can
 * still be identified precisely without cluttering the table.
 *
 * Where the API found a matching Telescope entry it becomes a link to the
 * message itself. The API returns no URL when Telescope is off or has pruned
 * the entry, so rows that cannot be opened are plain text rather than dead
 * links.
 */
const NotificationTypeField = (_props: ColumnProps) => {
  const record = useRecordContext();

  if (!record) return null;

  const label = <span>{record.notification_type}</span>;

  if (!record.telescope_url) {
    return <Tooltip title={record.notification_class || ''}>{label}</Tooltip>;
  }

  return (
    <Tooltip title="Open this email in Telescope">
      <a
        href={record.telescope_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {record.notification_type}
        <OpenInNewIcon sx={{ fontSize: 14 }} />
      </a>
    </Tooltip>
  );
};

const RecipientField = (_props: ColumnProps) => {
  const record = useRecordContext();

  if (!record) return null;

  // The account may have been deleted since. The record of what was sent
  // outlives it, so the row still shows rather than appearing blank.
  if (!record.recipient_email) {
    return <span style={{ color: '#999' }}>Deleted user #{record.notifiable_id}</span>;
  }

  return (
    <span>
      {record.recipient_name}
      <br />
      <span style={{ color: '#666', fontSize: '0.85em' }}>{record.recipient_email}</span>
    </span>
  );
};

export const NotificationLogList = () => (
  <List
    filters={notificationLogFilters}
    actions={<ListActions />}
    sort={{ field: 'created_at', order: 'DESC' }}
    perPage={50}
    title="Sent Notifications"
  >
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        What was sent and to whom. Message bodies are not stored here, since
        they carry temporary passwords and personal details. Where a matching
        Telescope entry still exists, the notification name links to the email
        itself; Telescope runs locally only, and prunes older entries.
      </Alert>
      <Datagrid bulkActionButtons={false} rowClick={false}>
        <DateField source="created_at" label="Sent" showTime />
        <NotificationTypeField source="notification_type" label="Notification" />
        <RecipientField source="recipient_email" label="Recipient" />
        <TextField source="channel" label="Channel" />
      </Datagrid>
    </>
  </List>
);

export default NotificationLogList;
