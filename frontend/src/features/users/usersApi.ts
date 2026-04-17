import { api } from '../../app/api'

export interface ManagedUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  isEmailVerified: boolean
  isActive: boolean
  createdAt?: string
}

interface UserListResponse {
  success: boolean
  data: {
    items: ManagedUser[]
    total: number
    page: number
    limit: number
  }
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<
      UserListResponse,
      { page?: number; limit?: number; role?: 'admin' | 'staff'; status?: 'active' | 'inactive'; q?: string }
    >({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
    updateUserRole: builder.mutation<{ success: boolean; data: ManagedUser }, { userId: string; role: 'admin' | 'staff' }>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['User'],
    }),
    updateUserStatus: builder.mutation<{ success: boolean; data: ManagedUser }, { userId: string; isActive: boolean }>({
      query: ({ userId, isActive }) => ({
        url: `/users/${userId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const { useListUsersQuery, useUpdateUserRoleMutation, useUpdateUserStatusMutation } = usersApi
