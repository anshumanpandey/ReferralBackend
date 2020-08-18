import { UserModel, USER_ROLE_ENUM } from "../models/user.model"
import { hash, hashSync } from "bcrypt"

export const SeedSuperadmin = () => {
    const userData = {
        companyName: "ReferralPortal",
        address: "Uk",
        pluginKey: "0",
        email: "super_admin@mail.com",
        password: hashSync("Mg5Hjn", 8),
        role: USER_ROLE_ENUM.SUPER_ADMIN,
        isDisabled: false,
    }
    return UserModel.findOrCreate({
        where: { email: 'super_admin@mail.com'},
        defaults: userData
    })
}