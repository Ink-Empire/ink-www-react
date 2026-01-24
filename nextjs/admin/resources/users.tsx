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
} from 'react-admin';
import { Box, Typography, Divider } from '@mui/material';

const userTypeChoices = [
  { id: 1, name: 'Client' },
  { id: 2, name: 'Artist' },
];

const UserTypeField = () => {
  const record = useRecordContext();
  if (!record) return null;
  return <span>{record.type_id === 2 ? 'Artist' : 'Client'}</span>;
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
