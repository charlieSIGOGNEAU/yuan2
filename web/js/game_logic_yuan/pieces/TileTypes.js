export const TILE_CONFIGS = {
    "Am": {
        image: './images/tiles/Am.webp',
        terrains: ["water","mountain","mine","water","forest","mountain","plain"],
        names: ["","","GE","","ALTAI","","CAO"]
    },
    "Bm": {
        image: './images/tiles/Bm.webp',
        terrains: ["forest","mountain","mine","water","forest","water","plain"],
        names: ["JU","","LI","","HUO","","MAND"]
    },
    "Cm": {
        image: './images/tiles/Cm.webp',
        terrains: ["water","mountain","plain","forest","mountain","mine","mountain"],
        names: ["","","QIN","TAN","","WUZ",""]
    },
    "Dm": {
        image: './images/tiles/Dm.webp',
        terrains: ["plain","water","forest","mine","rice","mountain","water"],
        names: ["CHENG","","ZAV","XU","BAO","",""]
    },
    "Em": {
        image: './images/tiles/Em.webp',
        terrains: ["water","rice","rice","plain","water","water","mountain"],
        names: ["","IK","HOV","GVI","","",""]
    },
    "Fm": {
        image: './images/tiles/Fm.webp',
        terrains: ["mountain","mountain","rice","plain","forest","water","mountain"],
        names: ["","","LIANG","KHAL","MAO","","",]
    },
    "Gm": {
        image: './images/tiles/Gm.webp',
        terrains: ["plain","rice","mine","rice","forest","mountain","mountain"],
        names: ["XIA","TANG","SONG","NIE","ULAN","",""]
    },
    "Hm": {
        image: './images/tiles/Hm.webp',
        terrains: ["mine","mine","water","water","mountain","rice","water"],
        names: ["BAY","ZHOU","","","","YAN",""]
    },
    "Im": {
        image: './images/tiles/Im.webp',
        terrains: ["mountain","mountain","mountain","mountain","water","rice","forest"],
        names: ["","","","","","FEI","GU"]
    },
    "Jm": {
        image: './images/tiles/Jm.webp',
        terrains: ["rice","water","plain","mountain","rice","mine","mountain"],
        names: ["LU","","HUAN","","JIN","LAI",""]
    },
    "Km": {
        image: './images/tiles/Km.webp',
        terrains: ["plain","water","forest","forest","mountain","mountain","water"],
        names: ["SUH","","OVOR","MI","","",""]
    },
    "Lm": {
        image: './images/tiles/Lm.webp',
        terrains: ["water","water","mine","plain","mine","water","water"],
        names: ["","","XIANG","WEY","TENG","",""]
    },
    "Mm": {
        image: './images/tiles/Mm.webp',
        terrains: ["water","water","mountain","mountain","forest","plain","mine"],
        names: ["","","","","YANG","ZONG","BAYAN"]
    },
    "Nm": {
        image: './images/tiles/Nm.webp',
        terrains: ["plain","forest","plain","rice","mine","water","rice"],
        names: ["ZOU","YI","TOV","MOU","GUZA","","BOGD"]
    },
    "Om": {
        image: './images/tiles/Om.webp',
        terrains: ["water","water","mine","mountain","mountain","forest","rice"],
        names: ["","","YING","","","BUL","YU"]
    }
}; 
export function tileInGame(numPlayers) {
    return {
      2: ["Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "Hm"],
      3: ["Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "Hm", "Im", "Jm", "Km", "Lm"],
      4: ["Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "Hm", "Im", "Jm", "Km", "Lm", "Mm", "Nm", "Om"]
    }[numPlayers];
  }
  


