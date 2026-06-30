export type AccountingType = "منزلي" | "تجاري" | "حكومي" | "كبار مشتركين" | "أخرى";

export interface Entry {
  id: string;
  name: string;
  cardNumber: string;
  address: string;
  branch: string;
  accountNumber: string;
  sewage: string;
  units: string;
  meterOpenDate: string;
  accountingType: AccountingType;
  bronzeNumber: string;
  installDate: string;
  mobile: string;
  plumber: string;
  couponNumber: string;
  couponAmount: string;
  notes: string;
}