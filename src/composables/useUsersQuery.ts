import { getUsers } from "@/services/users";
import { useQuery } from "@tanstack/vue-query";

export function getUsersQuery() {
   // GET: Fetch all comments
   const usersQuery = useQuery({
      queryKey: ['users'],
      queryFn: getUsers
   })

   return {
      users: usersQuery.data,
      isLoadingUsers: usersQuery.isLoading
   }
}