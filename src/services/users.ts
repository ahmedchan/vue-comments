import type { User } from "@/types/users"
import axios from "axios"

export const getUsers = async (): Promise<string[]> => {
   const result = await axios.get('https://dummyjson.com/users')
   const users = (result?.data?.users) as User[]
   const modifiedData = users.map(i => i.username)
   return modifiedData
}