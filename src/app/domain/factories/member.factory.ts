import { User, UserRole } from "../models/types";

// Los datos que vienen del formulario o del Excel
export interface CreateMemberDTO {
  name: string;
  role?: UserRole; // El signo de interrogación hace que el rol sea opcional
}

export class MemberFactory {
  static create(data: CreateMemberDTO): User {
    return {
      id: crypto.randomUUID(),
      name: data.name,
      role: data.role || UserRole.Junior // Si no se proporciona un rol, asignamos Junior por defecto
    };
  }
}