export interface Artwork {
  title: string;
  imagePath: string;
  description: string;
  dziPath: string;
  maxWidthPercentage: string;
  maxWidthPercentageMobile: string;
}

export const artworks: Artwork[] = [
  {
    title: "#8",
    imagePath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/png/8.png",
    dziPath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/8.dzi",
    description: `190cm x 190cm\naluminium dibond, direct print`,
    maxWidthPercentage: "45%",
    maxWidthPercentageMobile: "75%"
  },
  {
      title: "#5",
      imagePath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/png/5.png",
      dziPath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/5.dzi",
      description: `95.3cm x 190cm aluminium dibond, direct print`,
      maxWidthPercentage: "25%",
      maxWidthPercentageMobile: "50%"
  },
  {
    title: "#4",
    imagePath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/png/4.png",
    dziPath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/4.dzi",
    description: `300cm x 90cm aluminium dibond, direct print`,
    maxWidthPercentage: "70%",
    maxWidthPercentageMobile: "80%"
  },
  {
    title: "#2",
    imagePath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/png/2.png",
    dziPath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/2.dzi",
    description: `160cm x 90cm aluminium dibond, direct print`,
    maxWidthPercentage: "60%",
    maxWidthPercentageMobile: "80%"
  },
  {
    title: "#3",
    imagePath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/png/3.png",
    dziPath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/3.dzi",
    description: `135cm x 90cm aluminium dibond, direct print`,
    maxWidthPercentage: "60%",
    maxWidthPercentageMobile: "80%"
  },
  {
    title: "#6",
    imagePath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/png/6.png",
    dziPath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/6.dzi",
    description: `126.7cm x 190cm aluminium dibond, direct print`,
    maxWidthPercentage: "30%",
    maxWidthPercentageMobile: "55%"
  },
  {
    title: "#1",
    imagePath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/png/1.png",
    dziPath: "https://adndkr-art.s3.eu-north-1.amazonaws.com/1.dzi",
    description: `150cm x 100cm aluminium dibond, direct print`,
    maxWidthPercentage: "60%",
    maxWidthPercentageMobile: "75%"
  },
];
