import { DataProvider, GetListParams, GetOneParams, UpdateParams, DeleteParams, CreateParams } from 'react-admin';
import { api } from '@/utils/api';

/**
 * Custom data provider for React Admin that uses our existing API client.
 * All admin endpoints are prefixed with /admin.
 */
const dataProvider: DataProvider = {
  getList: async (resource: string, params: GetListParams) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 25 };
    const { field, order } = params.sort || { field: 'id', order: 'DESC' };
    const filter = params.filter || {};

    const queryParams = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      sort: field,
      order: order.toLowerCase(),
      filter: JSON.stringify(filter),
    });

    const response = await api.get<{ data: any[]; total: number }>(
      `/admin/${resource}?${queryParams.toString()}`,
      { useCache: false }
    );

    return {
      data: response.data,
      total: response.total,
    };
  },

  getOne: async (resource: string, params: GetOneParams) => {
    const response = await api.get<{ data: any }>(
      `/admin/${resource}/${params.id}`,
      { useCache: false }
    );

    return {
      data: response.data,
    };
  },

  getMany: async (resource: string, params: { ids: any[] }) => {
    // Fetch each item individually and combine
    const results = await Promise.all(
      params.ids.map((id) =>
        api.get<{ data: any }>(`/admin/${resource}/${id}`, { useCache: false })
      )
    );

    return {
      data: results.map((r) => r.data),
    };
  },

  getManyReference: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 25 };
    const { field, order } = params.sort || { field: 'id', order: 'DESC' };
    const filter = { ...params.filter, [params.target]: params.id };

    const queryParams = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      sort: field,
      order: order.toLowerCase(),
      filter: JSON.stringify(filter),
    });

    const response = await api.get<{ data: any[]; total: number }>(
      `/admin/${resource}?${queryParams.toString()}`,
      { useCache: false }
    );

    return {
      data: response.data,
      total: response.total,
    };
  },

  create: async (resource: string, params: CreateParams) => {
    const response = await api.post<{ data: any }>(
      `/admin/${resource}`,
      params.data
    );

    return {
      data: response.data,
    };
  },

  update: async (resource: string, params: UpdateParams) => {
    const response = await api.put<{ data: any }>(
      `/admin/${resource}/${params.id}`,
      params.data
    );

    return {
      data: response.data,
    };
  },

  updateMany: async (resource: string, params: { ids: any[]; data: any }) => {
    await Promise.all(
      params.ids.map((id) =>
        api.put(`/admin/${resource}/${id}`, params.data)
      )
    );

    return {
      data: params.ids,
    };
  },

  delete: async (resource: string, params: DeleteParams) => {
    const response = await api.delete<{ data: { id: any } }>(
      `/admin/${resource}/${params.id}`
    );

    return {
      data: response.data,
    };
  },

  deleteMany: async (resource: string, params: { ids: any[] }) => {
    await Promise.all(
      params.ids.map((id) => api.delete(`/admin/${resource}/${id}`))
    );

    return {
      data: params.ids,
    };
  },
};

export default dataProvider;
