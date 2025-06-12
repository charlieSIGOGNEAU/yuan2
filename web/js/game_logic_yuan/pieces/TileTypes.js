export const TILE_CONFIGS = {
    "Am": {
        image: '/images/Am.webp',
        zones: ["water","mountain","mine","water","forest","mountain","plain"],
        names: ["","","GE","","ALTAI","","CAO"]
    },
    "Bm": {
        image: '/images/Bm.webp',
        zones: ["forest","mountain","mine","water","forest","water","plain"],
        names: ["JU","","LI","","HUO","","MAND"]
    },
    "Cm": {
        image: '/images/Cm.webp',
        zones: ["water","mountain","plain","forest","mountain","mine","mountain"],
        names: ["","","QIN","TAN","","WUZ",""]
    },
    "Dm": {
        image: '/images/Dm.webp',
        zones: ["plain","water","forest","mine","rice","mountain","water"],
        names: ["CHENG","","ZAV","XU","BAO","",""]
    },
    "Em": {
        image: '/images/Em.webp',
        zones: ["water","rice","rice","plain","water","water","mountain"],
        names: ["","IK","HOV","GVI","","",""]
    },
    "Fm": {
        image: '/images/Fm.webp',
        zones: ["mountain","mountain","rice","plain","forest","water","mountain"],
        names: ["","","LIANG","KHAL","MAO","","",]
    },
    "Gm": {
        image: '/images/Gm.webp',
        zones: ["plain","rice","mine","rice","forest","mountain","mountain"],
        names: ["XIA","TANG","SONG","NIE","ULAN","",""]
    },
    "Hm": {
        image: '/images/Hm.webp',
        zones: ["mine","mine","water","water","mountain","rice","water"],
        names: ["BAY","ZHOU","","","","YAN",""]
    },
    "Im": {
        image: '/images/Im.webp',
        zones: ["mountain","mountain","mountain","mountain","water","rice","forest"],
        names: ["","","","","","FEI","GU"]
    },
    "Jm": {
        image: '/images/Jm.webp',
        zones: ["rice","water","plain","mountain","rice","mine","mountain"],
        names: ["LU","","HUAN","","JIN","LAI",""]
    },
    "Km": {
        image: '/images/Km.webp',
        zones: ["plain","water","forest","forest","mountain","mountain","water"],
        names: ["SUH","","OVOR","MI","","",""]
    },
    "Lm": {
        image: '/images/Lm.webp',
        zones: ["water","water","mine","plain","mine","water","water"],
        names: ["","","XIANG","WEY","TENG","",""]
    },
    "Mm": {
        image: '/images/Mm.webp',
        zones: ["water","water","mountain","mountain","forest","plain","mine"],
        names: ["","","","","YANG","ZONG","BAYAN"]
    },
    "Nm": {
        image: '/images/Nm.webp',
        zones: ["plain","forest","plain","rice","mine","water","rice"],
        names: ["ZOU","YI","TOV","MOU","GUZA","","BOGD"]
    },
    "Om": {
        image: '/images/Om.webp',
        zones: ["water","water","mine","mountain","mountain","forest","rice"],
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
  


