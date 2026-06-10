import type { Sede } from '@shared/domain/types'
import { sedeRepo } from '../repositories/sedeRepo'

export const sedeService = {
  listar(): Sede[] {
    return sedeRepo.listar()
  }
}
