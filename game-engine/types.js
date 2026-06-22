// @ts-check

/**
 * @typedef {object} AreaNode
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {string[]=} links
 */

/**
 * @typedef {object} AreaLocation
 * @property {string} id
 * @property {string} label
 * @property {string} node
 * @property {string=} area
 * @property {"gate"|"room"|"future"|string=} kind
 * @property {string=} icon
 * @property {string=} hint
 * @property {string[]=} shopCategories
 * @property {string=} defaultCategory
 * @property {number=} focusRadius
 * @property {string=} markerStyle
 */

/**
 * @typedef {object} SceneConfig
 * @property {string=} scene
 * @property {string=} npc
 * @property {string=} npcClass
 * @property {string=} npcImage
 * @property {number=} npcNaturalHeightCm
 * @property {string=} travelLine
 * @property {string=} travelAction
 * @property {unknown=} sceneArt
 */

/**
 * @typedef {object} AreaManifest
 * @property {string} id
 * @property {string} label
 * @property {boolean} enabled
 * @property {string} defaultNode
 * @property {string=} view
 * @property {{ width: number, height: number }=} imageSize
 * @property {string=} mapImage
 * @property {Record<string, AreaNode>=} nodes
 * @property {AreaLocation[]=} locations
 * @property {unknown[]=} actors
 */

/**
 * @typedef {object} WorldDestination
 * @property {string} id
 * @property {string} label
 * @property {boolean} enabled
 * @property {string=} area
 * @property {string=} entryNode
 * @property {number} x
 * @property {number} y
 * @property {string=} icon
 * @property {string=} hint
 */

/**
 * @typedef {object} WardrobeItem
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} cost
 * @property {string=} icon
 * @property {string=} image
 * @property {Record<string, string>=} equips
 */

/**
 * @typedef {object} OutfitState
 * @property {string=} room
 * @property {string=} hairstyle
 * @property {string=} top
 * @property {string=} bottom
 * @property {string=} dress
 * @property {string=} shoes
 * @property {string=} headTop
 * @property {string=} headSide
 * @property {string=} faceEyes
 * @property {string=} faceMask
 * @property {string=} neck
 * @property {string=} hand
 */

/**
 * @typedef {object} GameState
 * @property {string} area
 * @property {string} playerNode
 * @property {{ x: number, y: number }} player
 * @property {number} coins
 * @property {number} energy
 * @property {number} difficulty
 * @property {OutfitState} outfit
 * @property {string[]} owned
 * @property {unknown[]=} diary
 * @property {unknown=} activeQuest
 */

/**
 * @typedef {object} AreaMapViewport
 * @property {{ x: number, y: number }} pan
 * @property {number} zoom
 */

/**
 * @typedef {object} AreaMapMetrics
 * @property {number} width
 * @property {number} height
 * @property {number} displayWidth
 * @property {number} displayHeight
 * @property {number} panX
 * @property {number} panY
 * @property {number} zoom
 * @property {number} offsetX
 * @property {number} offsetY
 */

export {};
