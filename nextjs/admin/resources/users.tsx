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
} from 'react-admin';

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
      <TextInput source="phone" />
      <TextInput source="location" />
      <TextInput source="about" multiline rows={4} />
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
      <TextInput source="phone" />
      <TextInput source="location" />
      <TextInput source="about" multiline rows={4} />
    </SimpleForm>
  </Create>
);
