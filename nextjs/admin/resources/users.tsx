import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  BooleanField,
  DateField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  BooleanInput,
  SelectInput,
  PasswordInput,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  SearchInput,
  useRecordContext,
  NumberInput,
  FormDataConsumer,
  Labeled,
  useRefresh,
  useNotify,
  Button,
} from 'react-admin';
import { Box, Typography, Divider } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import { api } from '@/utils/api';

const userTypeChoices = [
  { id: 1, name: 'Client' },
  { id: 2, name: 'Artist' },
];

const UserTypeField = () => {
  const record = useRecordContext();
  if (!record) return null;
  return <span>{record.type_id === 2 ? 'Artist' : 'Client'}</span>;
};

const RebuildUserButton = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();

  if (!record) return null;

  // Only show for artists (type_id: 2)
  if (record.type_id !== 2) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Rebuild artist in Elasticsearch?`)) return;
    try {
      await api.post(`/admin/elastic/rebuild-bypass`, {
        ids: [record.id],
        model: 'artist'
      });
      notify('Rebuild request sent', { type: 'success' });
      refresh();
    } catch {
      notify('Unable to rebuild artist', { type: 'error' });
    }
  };

  return (
    <Button label="Rebuild" onClick={handleClick}>
      <AutoModeIcon />
    </Button>
  );
};

const userFilters = [
  <SearchInput source="q" alwaysOn key="search" />,
  <SelectInput
    source="type_id"
    choices={userTypeChoices}
    key="type"
  />,
  <BooleanInput source="is_admin" label="Admin Only" key="admin" />,
  <BooleanInput source="is_demo" label="Demo Users" key="demo" />,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
);

const SendPasswordResetButton = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();

  if (!record) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Send password reset email to ${record.email}?`)) return;
    try {
      await api.post(`/admin/users/${record.id}/send-password-reset`, {});
      notify('Password reset email sent', { type: 'success' });
      refresh();
    } catch {
      notify('Failed to send password reset email', { type: 'error' });
    }
  };

  return (
    <Button label="Reset PW" onClick={handleClick}>
      <LockResetIcon />
    </Button>
  );
};

const ResendVerificationButton = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();

  if (!record) return null;

  const isVerified = !!record.email_verified_at;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVerified) return;
    if (!confirm(`Resend verification email to ${record.email}?`)) return;
    try {
      await api.post(`/admin/users/${record.id}/resend-verification`, {});
      notify('Verification email sent', { type: 'success' });
      refresh();
    } catch {
      notify('Failed to send verification email', { type: 'error' });
    }
  };

  return (
    <Button
      label="Verify Email"
      onClick={handleClick}
      disabled={isVerified}
      sx={isVerified ? { opacity: 0.4, pointerEvents: 'none' } : {}}
    >
      <MarkEmailReadIcon />
    </Button>
  );
};

export const UserList = () => (
  <List
    filters={userFilters}
    actions={<ListActions />}
    sort={{ field: 'id', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="username" />
      <UserTypeField source="type_id" label="Type" />
      <BooleanField source="is_admin" label="Admin" />
      <BooleanField source="is_demo" label="Demo" />
      <TextField source="location" />
      <DateField source="created_at" label="Created" />
      <RebuildUserButton />
      <SendPasswordResetButton />
      <ResendVerificationButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" />
      <TextInput source="email" />
      <TextInput source="username" />
      <SelectInput source="type_id" choices={userTypeChoices} label="User Type" />
      <BooleanInput source="is_admin" label="Admin" />
      <BooleanInput source="is_demo" label="Demo User" />
      <TextInput source="phone" />
      <TextInput source="location" />
      <TextInput source="about" multiline rows={4} />

      <FormDataConsumer>
        {({ formData }) =>
          formData.type_id === 2 && (
            <Box sx={{ width: '100%', mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>Artist Settings</Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <BooleanInput source="artist_settings.books_open" label="Books Open" />
                <BooleanInput source="artist_settings.accepts_walk_ins" label="Accepts Walk-ins" />
                <BooleanInput source="artist_settings.accepts_deposits" label="Accepts Deposits" />
                <BooleanInput source="artist_settings.accepts_consultations" label="Accepts Consultations" />
                <BooleanInput source="artist_settings.accepts_appointments" label="Accepts Appointments" />
                <BooleanInput source="artist_settings.seeking_guest_spots" label="Seeking Guest Spots" />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                <NumberInput source="artist_settings.hourly_rate" label="Hourly Rate (cents)" />
                <NumberInput source="artist_settings.deposit_amount" label="Deposit Amount (cents)" />
                <NumberInput source="artist_settings.consultation_fee" label="Consultation Fee (cents)" />
                <NumberInput source="artist_settings.minimum_session" label="Minimum Session (minutes)" />
              </Box>
            </Box>
          )
        }
      </FormDataConsumer>
    </SimpleForm>
  </Edit>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="email" type="email" required />
      <PasswordInput source="password" required />
      <TextInput source="username" />
      <SelectInput source="type_id" choices={userTypeChoices} label="User Type" defaultValue={1} required />
      <BooleanInput source="is_admin" label="Admin" />
      <BooleanInput source="is_demo" label="Demo User" />
      <TextInput source="phone" />
      <TextInput source="location" />
      <TextInput source="about" multiline rows={4} />
    </SimpleForm>
  </Create>
);
