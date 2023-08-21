export interface UpDataAttributesAmount {
  currencyCode: string;
  value: string;
  valueInBaseUnits: number;
}

export interface UpDataAttributes {
  status: string;
  rawText: string;
  description: string;
  message?: string | null;
  isCategorizable: boolean;
  holdInfo: string;
  roundUp: string;
  cashback: string;
  amount: UpDataAttributesAmount;
  foreignAmount: string;
  settledAt: string;
  createdAt: string;
  eventType: string;
  displayName: string;
  accountType: string;
  ownershipType: string;
  balance: UpDataAttributesAmount;
}

export interface UpRelationshipData {
  type: string;
  id: string;
}

export interface UpRelationshipLinks {
  self: string;
  related: string;
}

export interface UpDataRelationships {
  account: {
    data: UpRelationshipData;
    links: UpRelationshipLinks;
  };
  transferAccount: {
    data: UpRelationshipData;
    links: UpRelationshipLinks;
  };
  category: {
    data: UpRelationshipData;
    links: UpRelationshipLinks;
  };
  parentCategory: {
    data: UpRelationshipData;
    links: UpRelationshipLinks;
  };
  tags: {
    data: UpRelationshipData[];
    links: UpRelationshipLinks;
  };
  webhook: {
    data: UpRelationshipData;
    links: UpRelationshipLinks;
  };
  transaction: {
    data: UpRelationshipData;
    links: UpRelationshipLinks;
  };
}

export interface UpDataLinks {
  self: string;
}

export interface UpData {
  type: string;
  id: string;
  attributes: UpDataAttributes;
  relationships: UpDataRelationships;
  links: UpDataLinks;
}

export interface UpRootObject {
  data: UpData;
}

export interface UpTransactionList {
  data: UpData[];
}
