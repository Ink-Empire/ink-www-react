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
  ReferenceField,
  NumberInput,
} from 'react-admin';

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
      <DateField source="created_at" label="Created" />
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
