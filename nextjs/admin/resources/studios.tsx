import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  SearchInput,
  useRecordContext,
  useRefresh,
  useNotify,
  ReferenceField,
  NumberInput,
  Button,
} from 'react-admin';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { adminService } from '@/services/adminService';

const studioFilters = [
  <SearchInput source="q" alwaysOn key="search" />,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
);

const OwnerField = () => {
  const record = useRecordContext();
  if (!record?.owner) return <span>-</span>;
  return <span>{record.owner.name} ({record.owner.email})</span>;
};

const HoldStatusField = () => {
  const record = useRecordContext();
  if (!record) return null;

  if (record.hold_status !== 'on_hold') return <span>-</span>;

  return (
    <span
      title={record.hold_reason || undefined}
      style={{
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '12px',
        backgroundColor: '#5c2a2a',
        color: '#ffd9d9',
        whiteSpace: 'nowrap',
      }}
    >
      On hold
    </span>
  );
};

// Takes the studio out of public view and emails the owner asking them to
// establish that they run the business. Nothing is deleted, and the release
// button puts it all back.
const HoldButton = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();

  if (!record || record.hold_status === 'on_hold') return null;

  const handleHold = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const reason = prompt(
      `Put ${record.name} on hold?\n\n` +
        'The page comes down and the owner is emailed to confirm they run the business. ' +
        'Nothing is deleted and this can be undone.\n\n' +
        'Why are you holding it? This is recorded against the studio.'
    );

    if (reason === null) return;

    if (!reason.trim()) {
      notify('A reason is required', { type: 'warning' });
      return;
    }

    try {
      const result = await adminService.holdStudio(Number(record.id), reason.trim());
      notify(
        result.owner_notified
          ? 'Studio on hold, owner emailed'
          : 'Studio on hold. No owner on record, so no email was sent',
        { type: 'success' }
      );
      refresh();
    } catch (error) {
      notify('Failed to put the studio on hold', { type: 'error' });
    }
  };

  return (
    <Button label="Hold" onClick={handleHold} color="warning">
      <PauseCircleIcon />
    </Button>
  );
};

const ReleaseButton = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();

  if (!record || record.hold_status !== 'on_hold') return null;

  const handleRelease = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Put ${record.name} back? The page and its search listings return immediately.`)) {
      return;
    }

    try {
      await adminService.releaseStudio(Number(record.id));
      notify('Hold lifted', { type: 'success' });
      refresh();
    } catch (error) {
      notify('Failed to lift the hold', { type: 'error' });
    }
  };

  return (
    <Button label="Release" onClick={handleRelease} color="success">
      <PlayCircleIcon />
    </Button>
  );
};

export const StudioList = () => (
  <List
    filters={studioFilters}
    actions={<ListActions />}
    sort={{ field: 'id', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="slug" />
      <EmailField source="email" />
      <OwnerField label="Owner" />
      <TextField source="location" />
      <HoldStatusField label="Hold" />
      <DateField source="created_at" label="Created" />
      <HoldButton />
      <ReleaseButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const StudioEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" />
      <TextInput source="slug" />
      <TextInput source="email" />
      <TextInput source="phone" />
      <NumberInput source="owner_id" label="Owner ID" />
      <TextInput source="location" />
      <TextInput source="about" multiline rows={4} />
    </SimpleForm>
  </Edit>
);

export const StudioCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="slug" />
      <TextInput source="email" type="email" />
      <TextInput source="phone" />
      <NumberInput source="owner_id" label="Owner ID" />
      <TextInput source="location" />
      <TextInput source="about" multiline rows={4} />
    </SimpleForm>
  </Create>
);
