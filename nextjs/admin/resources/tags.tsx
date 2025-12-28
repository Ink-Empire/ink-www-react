import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  NumberField,
  DateField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  BooleanInput,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  SearchInput,
  useRecordContext,
  useRefresh,
  useNotify,
  Button,
} from 'react-admin';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { api } from '@/utils/api';

const tagFilters = [
  <SearchInput source="q" alwaysOn key="search" />,
  <BooleanInput source="is_pending" label="Pending Only" key="pending" />,
  <BooleanInput source="is_ai_generated" label="AI Generated" key="ai" />,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
);

const ApproveButton = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();

  if (!record || !record.is_pending) return null;

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/admin/tags/${record.id}/approve`, {});
      notify('Tag approved', { type: 'success' });
      refresh();
    } catch (error) {
      notify('Failed to approve tag', { type: 'error' });
    }
  };

  return (
    <Button
      label="Approve"
      onClick={handleApprove}
      color="success"
    >
      <CheckIcon />
    </Button>
  );
};

const RejectButton = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();

  if (!record || !record.is_pending) return null;

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to reject and delete this tag?')) {
      return;
    }
    try {
      await api.post(`/admin/tags/${record.id}/reject`, {});
      notify('Tag rejected and deleted', { type: 'success' });
      refresh();
    } catch (error) {
      notify('Failed to reject tag', { type: 'error' });
    }
  };

  return (
    <Button
      label="Reject"
      onClick={handleReject}
      color="error"
    >
      <CloseIcon />
    </Button>
  );
};

const StatusChip = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {record.is_pending ? (
        <span style={{
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Pending
        </span>
      ) : (
        <span style={{
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Approved
        </span>
      )}
      {record.is_ai_generated && (
        <span style={{
          backgroundColor: '#5B8FB9',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          <AutoAwesomeIcon style={{ fontSize: '12px' }} />
          AI
        </span>
      )}
    </div>
  );
};

export const TagList = () => (
  <List
    filters={tagFilters}
    actions={<ListActions />}
    sort={{ field: 'id', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="slug" />
      <StatusChip label="Status" />
      <NumberField source="tattoos_count" label="Tattoos" />
      <DateField source="created_at" label="Created" />
      <ApproveButton />
      <RejectButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const TagEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" />
      <TextInput source="slug" />
      <BooleanInput source="is_pending" label="Pending Approval" />
    </SimpleForm>
  </Edit>
);

export const TagCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <BooleanInput source="is_pending" label="Pending Approval" defaultValue={false} />
    </SimpleForm>
  </Create>
);
