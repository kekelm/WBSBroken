import { initialize } from '@microsoft/power-apps/app';
import { useQuery } from '@tanstack/react-query';

import type { User } from '@/generated/models/Office365UsersModel';
import { Office365UsersService } from '@/generated/services/Office365UsersService';

const wait = (milliseconds: number) => new Promise<void>((resolve: () => void) => {
  window.setTimeout(resolve, milliseconds);
});

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Office 365 Users SearchUserV2 failed without an error message.';
};

export const useM365PeopleSearch = (searchTerm: string) => {
  const normalizedSearchTerm = searchTerm.trim();

  return useQuery({
    queryKey: ['office365users', 'search', normalizedSearchTerm],
    queryFn: async (): Promise<User[]> => {
      await wait(500);

      let lastError: Error | undefined;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await initialize();
          const result = await Office365UsersService.SearchUserV2(normalizedSearchTerm, 8, true);
          if (!result.success) {
            throw new Error(getErrorMessage(result.error));
          }

          return (result.data?.value ?? []).filter((user: User) => Boolean(user.Id && user.DisplayName && (user.UserPrincipalName || user.Mail)));
        } catch (error: unknown) {
          lastError = new Error(getErrorMessage(error));
          if (attempt < 2) {
            await wait(500 * (2 ** attempt));
          }
        }
      }

      throw lastError ?? new Error('Office 365 Users search failed.');
    },
    enabled: normalizedSearchTerm.length >= 2,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
