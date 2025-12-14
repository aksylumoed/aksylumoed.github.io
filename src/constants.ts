
import { SIXTEEN, SubImage } from "./subimages";

export interface Artwork {
  id: string;
  title: string;
  imagePath?: string;    // single image fallback
  subImages?: SubImage[]; // array of multiple images

  description: string;
  /**
   * Default max width for single-image or fallback for sub-images
   */
  maxWidthPercentage: string;
  maxWidthPercentageMobile: string;
}

export const artworks: Artwork[] = [
  {
    id: '8',
    title: "#8",
    imagePath: "../png/8-fs8.png",
    description: `190cm x 190cm\naluminium dibond, direct print`,
    maxWidthPercentage: "45%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '12',
    title: "#12",
    imagePath: "../png/12-fs8.png",
    description: `155cm x 105cm aluminium dibond, direct print`,
    maxWidthPercentage: "60%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '16',
    title: "#16.x",
    subImages: SIXTEEN,
    description: "55 x 50cm x 75cm aluminium dibond, direct print",
    maxWidthPercentage: "50%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '5',
    title: "#5",
    imagePath: "../png/5-fs8.png",
    description: `95.3cm x 190cm aluminium dibond, direct print`,
    maxWidthPercentage: "23%",
    maxWidthPercentageMobile: "50%"
  },
  {
    id: '11',
    title: "#11",
    imagePath: "../png/11.png",
    description: `100cm x 100cm\naluminium dibond, direct print`,
    maxWidthPercentage: "45%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '2',
    title: "#2",
    imagePath: "../png/2-fs8.png",
    description: `160cm x 90cm aluminium dibond, direct print`,
    maxWidthPercentage: "60%",
    maxWidthPercentageMobile: "80%"
  },
  {
    id: '15',
    title: "#15",
    imagePath: "../png/15-fs8.png",
    description: `120cm x 150cm aluminium dibond, direct print`,
    maxWidthPercentage: "40%",
    maxWidthPercentageMobile: "70%"
  },
  {
    id: '3',
    title: "#3",
    imagePath: "../png/3-fs8.png",
    description: `135cm x 90cm aluminium dibond, direct print`,
    maxWidthPercentage: "60%",
    maxWidthPercentageMobile: "80%"
  },
  {
    id: '9',
    title: "#9",
    imagePath: "../png/9-fs8.png",
    description: `240cm x 102,2cm aluminium dibond, direct print`,
    maxWidthPercentage: "70%",
    maxWidthPercentageMobile: "80%"
  },
  {
    id: '14-1',
    title: "#14.1",
    imagePath: "../png/14.1.png",
    description: `12cm x 12cm\naluminium dibond, direct print`,
    maxWidthPercentage: "45%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '4',
    title: "#4",
    imagePath: "../png/4-fs8.png",
    description: `300cm x 90cm aluminium dibond, direct print`,
    maxWidthPercentage: "70%",
    maxWidthPercentageMobile: "80%"
  },
  {
    id: '13-1',
    title: "#13.1",
    imagePath: "../png/13.png",
    description: `145cm x 145cm aluminium dibond, direct print`,
    maxWidthPercentage: "45%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '13-2',
    title: "#13.2",
    imagePath: "../png/13.2-fs8.png",
    description: `145cm x 145cm aluminium dibond, direct print`,
    maxWidthPercentage: "45%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '1',
    title: "#1",
    imagePath: "../png/1-fs8.png",
    description: `150cm x 100cm aluminium dibond, direct print`,
    maxWidthPercentage: "60%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '17',
    title: "#17",
    imagePath: "../png/17-fs8.png",
    description: `155cm x 105cm aluminium dibond, direct print`,
    maxWidthPercentage: "60%",
    maxWidthPercentageMobile: "75%"
  },
  {
    id: '6',
    title: "#6",
    imagePath: "../png/6-fs8.png",
    description: `126.7cm x 190cm aluminium dibond, direct print`,
    maxWidthPercentage: "30%",
    maxWidthPercentageMobile: "65%"
  },
  {
    id: '10',
    title: "#10",
    imagePath: "../png/10.png",
    description: `l: 150 x 150cm \nm: 150 x 150cm \nr: 150 x 150cm \naluminium dibond, direct print`,
    maxWidthPercentage: "100%",
    maxWidthPercentageMobile: "80%"
  },
];
