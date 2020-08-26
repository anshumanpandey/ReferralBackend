import { UserModel } from "../models/user.model"

export default async (expressQuery?: any) => {
    if (!expressQuery.pluginKey) return false
    
    const user = await UserModel.findOne({ where: { pluginKey: expressQuery.pluginKey }})
    return user != null
}