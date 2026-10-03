import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advertisement } from './entities/advertisement.entity';
import { CreateAdDto, UpdateAdDto } from './dto/ad.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UserType } from '../users/entities/user.entity';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Advertisement)
    private readonly adRepository: Repository<Advertisement>,
  ) {}

  /** Live ads for the public home carousel. */
  getApproved(): Promise<Advertisement[]> {
    return this.adRepository.find({
      where: { approved: true },
      order: { createdAt: 'DESC' },
    });
  }

  getByUser(userId: string): Promise<Advertisement[]> {
    return this.adRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Moderation view; `approved` filters when given. */
  getAll(approved?: boolean): Promise<Advertisement[]> {
    return this.adRepository.find({
      where: approved === undefined ? {} : { approved },
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: string): Promise<Advertisement> {
    const ad = await this.adRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    return ad;
  }

  create(dto: CreateAdDto, userId: string): Promise<Advertisement> {
    const entity = this.adRepository.create({
      ...dto,
      userId,
      approved: false,
    });
    return this.adRepository.save(entity);
  }

  async update(
    id: string,
    dto: UpdateAdDto,
    user: JwtPayload,
  ): Promise<Advertisement> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No updatable fields provided');
    }
    const existing = await this.getById(id);
    this.assertCanModify(existing, user);
    const merged = this.adRepository.merge(existing, dto);
    return this.adRepository.save(merged);
  }

  async delete(id: string, user: JwtPayload): Promise<{ success: true }> {
    const ad = await this.getById(id);
    this.assertCanModify(ad, user);
    await this.adRepository.delete(id);
    return { success: true };
  }

  async approve(id: string, approved: boolean): Promise<Advertisement> {
    const ad = await this.getById(id);
    ad.approved = approved;
    return this.adRepository.save(ad);
  }

  private assertCanModify(ad: Advertisement, user: JwtPayload): void {
    const isAdmin = user.type === UserType.ADMIN;
    const isOwner = ad.userId === user.sub;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You cannot modify this advertisement');
    }
  }
}
