import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { AppRouter } from "./routers/_app";


export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: (count, error) => {
          const toAttempt = isServer ? 0 : 3;

          if (!isTRPCClientError(error) || !error.data) {
            return toAttempt < count;
          }

          if (error.data.httpStatus >= 400 && error.data.httpStatus < 500) {
            return false;
          }

          return toAttempt < count;
        },
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}






export const isTRPCClientError = (
  error: Error,
): error is TRPCClientError<AppRouter> => {
  return error instanceof TRPCClientError;
};