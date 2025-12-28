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
  NumberInput,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  SearchInput,
} from 'react-admin';

const placementFilters = [
  <SearchInput source="q" alwaysOn key="search" />,
  <BooleanInput source="is_active" label="Active Only" key="active" />,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
);

export const PlacementList = () => (
  <List
    filters={placementFilters}
    actions={<ListActions />}
    sort={{ field: 'sort_order', order: 'ASC' }}
    perPage={50}
  >
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="slug" />
      <NumberField source="sort_order" label="Sort Order" />
      <BooleanField source="is_active" label="Active" />
      <DateField source="created_at" label="Created" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const PlacementEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" />
      <TextInput source="slug" />
      <NumberInput source="sort_order" label="Sort Order" />
      <BooleanInput source="is_active" label="Active" />
    </SimpleForm>
  </Edit>
);

export const PlacementCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <NumberInput source="sort_order" label="Sort Order" defaultValue={0} />
      <BooleanInput source="is_active" label="Active" defaultValue={true} />
    </SimpleForm>
  </Create>
);
