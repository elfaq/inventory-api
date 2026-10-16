import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

// Ubah "12" menjadi 12 (untuk form-data). String kosong dibiarkan agar ditolak @IsInt
const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class CreateProductDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // Diterima sebagai string agar presisi Decimal terjaga ("15000.50")
  @Transform(({ value }) =>
    typeof value === 'number' ? value.toString() : value,
  )
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/, {
    message: 'price harus angka positif, maksimal 10 digit dan 2 angka desimal',
  })
  price: string;

  @Transform(toNumber)
  @IsInt()
  @Min(0)
  stock: number;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  categoryId: number;
}
