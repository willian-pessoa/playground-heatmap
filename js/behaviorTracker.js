const GLOBAL_TRACK_DATA = {}
const GLOBAL_MOUSE_DATA = {}

const normalizeFPS = callback => {
  let ticking = true;
  const update = () => {
    if (ticking) requestAnimationFrame(update);
    ticking = true;
  };
  return event => {
    if (ticking) {
      callback(event);
      update();
    }
    ticking = false;
  };
};

const getEffectingArea = (element) => {
  const { top, left, right, bottom } = element.getBoundingClientRect()

  return { top, left, right, bottom }
}

const isNotPositionStatic = (element) => {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.position !== "static" && computedStyle.position !== "relative";
}

const getChildrenMapKeys = (element) => {
  const childrenKeys = []
  for (const child of element.children) {
    if (child.__heatmap_node_map_id__) {
      const children = {}
      children.childrenKey = child.__heatmap_node_map_id__

      if (child.children.length) {
        children.childrenKeys = getChildrenMapKeys(child)
      }
      childrenKeys.push(children)
    }
  }
  return childrenKeys
}

const convertCustomCssSelector = (cssSelector) => {
  if (!cssSelector) return null

  let newCssSelector = cssSelector

  const bracketsRegex = /\[(\d+)\]/g

  if (bracketsRegex.test(cssSelector)) {
    newCssSelector = cssSelector.replaceAll(bracketsRegex, "nth-of-type($1)");
  }

  return newCssSelector
}

const getSiblingTypeIndex = (element) => {
  if (!element || !element.parentElement?.children) return 0

  let siblingIndex = 0

  for (let item of element.parentElement.children) {
    if (item.__heatmap_node_map_id__ === element.__heatmap_node_map_id__) {
      return siblingIndex
    }

    if (item.nodeName !== element.nodeName) continue

    siblingIndex++
  }

  return siblingIndex
}

const getNodeName = (element) => {
  if (!element) return

  let nodeName = element.nodeName.toLowerCase()
  let idElement = element.id
  let siblingIndex = getSiblingTypeIndex(element)

  if (idElement) {
    return `#${idElement}`
  }

  return !siblingIndex ? nodeName : `${nodeName}:[${siblingIndex + 1}]`
}

const getParentsElements = (element) => {
  if (!element) return ""

  if (!element.parentElement) return "body"

  if (element.parentElement.nodeName === "BODY") return "body"

  if (element.parentElement) {
    let parentNodeName = " > " + getNodeName(element.parentElement)

    return getParentsElements(element.parentElement) + parentNodeName
  } else {
    return " > "
  }
}

const getElementCssSelector = (element) => {
  if (!element) return

  let idCssSelector = ""

  let nodeName = getNodeName(element)
  let parents = getParentsElements(element)

  idCssSelector = parents + " > " + nodeName

  return idCssSelector
}

const getMapElementByIdCssSelector = (idCssSelector) => {
  for (const elementKey in GLOBAL_MOUSE_DATA) {
    const { idCssSelector: cssSelector, id } = GLOBAL_MOUSE_DATA[elementKey]
    if (cssSelector === idCssSelector) {
      return id
    }
  }

  return null
}

const pushMouseClickEventData = (event) => {
  event.stopPropagation()

  // compute the relative position inside the element
  const { offsetX, offsetY } = event
  const { __heatmap_node_map_id__, scrollHeight, scrollWidth } = event.target

  const posX = offsetX / scrollWidth
  const posY = offsetY / scrollHeight

  // If element not in the elements DOM maping, add to it with the click
  if (!__heatmap_node_map_id__) {
    const idCssSelector = getElementCssSelector(event.target)

    const hashNodeMapId = getMapElementByIdCssSelector(idCssSelector)

    if (hashNodeMapId) {
      GLOBAL_MOUSE_DATA[hashNodeMapId].clickData.push({
        time: Date.now(),
        posX,
        posY
      })

      GLOBAL_MOUSE_DATA[hashNodeMapId].clicks++

      return
    }

    const countId = GLOBAL_TRACK_DATA.nodeAmount

    event.target.__heatmap_node_map_id__ = countId

    GLOBAL_MOUSE_DATA[countId] = {
      id: countId,
      idCssSelector,
      clicks: 1,
      clickData: [{ time: Date.now(), posX, posY }],
      moveData: [],
    }

    GLOBAL_TRACK_DATA.nodeAmount = countId + 1

    return
  }

  // push the relative position to the dom element maping
  const nodeMapId = __heatmap_node_map_id__

  GLOBAL_MOUSE_DATA[nodeMapId].clickData.push({
    time: Date.now(),
    posX,
    posY
  })

  GLOBAL_MOUSE_DATA[nodeMapId].clicks++
}

const pushMouseMoveEventData = (event) => {
  const { offsetX, offsetY } = event

  const { __heatmap_node_map_id__, scrollHeight, scrollWidth } = event.target

  const nodeMapId = __heatmap_node_map_id__

  const posX = offsetX / scrollWidth
  const posY = offsetY / scrollHeight

  if (!posX || !posY) {
    event.stopPropagation()
    return
  }

  GLOBAL_MOUSE_DATA[nodeMapId].moveData.push({
    time: Date.now(),
    posX,
    posY
  })

  event.stopPropagation()
}

const trackMouse = () => {
  GLOBAL_TRACK_DATA.pageUrl = window.location.href
  GLOBAL_TRACK_DATA.startRecordAt = Date.now()

  const body = document.querySelector("body");
  const elements = body.querySelectorAll("*");

  let countId = 1

  document.addEventListener("click", pushMouseClickEventData)

  elements.forEach((element) => {
    // Add the mouse event
    //element.addEventListener("click", pushMouseClickEventData)
    element.addEventListener("mousemove", normalizeFPS(pushMouseMoveEventData))

    // Add the element a uniqueId with a css selector to the element
    element["__heatmap_node_map_id__"] = countId
    GLOBAL_MOUSE_DATA[countId] = {
      id: countId,
      idCssSelector: getElementCssSelector(element),
      clicks: 0,
      clickData: [],
      moveData: [],
    }

    countId++
  });

  GLOBAL_TRACK_DATA.nodeAmount = countId

  return
};

const isCordinateInside = (cordinate, canOverlapElements) => {
  for (element of canOverlapElements) {
    const { top, left, bottom, right } = element.effectingArea
    const { posX, posY } = cordinate

    if (posX > left && posX < right && posY < bottom && posY > top) {
      return true
    }
  }

  return false
}

const plotClicks = () => {
  console.time("Plot")

  const cordinates = []
  const canOverlapElements = []

  // COMPUTE X,Y to PLOT
  for (const elementKey in GLOBAL_MOUSE_DATA) {
    const { idCssSelector, clickData } = GLOBAL_MOUSE_DATA[elementKey]

    if (clickData.length && idCssSelector) {
      const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

      if (!element) continue

      if (isNotPositionStatic(element)) {
        canOverlapElements.push({
          elementKey,
          associateElements: getChildrenMapKeys(element),
          effectingArea: getEffectingArea(element)
        })
        continue
      }

      const rect = element.getBoundingClientRect()

      const elementWidth = element.scrollWidth
      const elementHeight = element.scrollHeight
      const elementPosX = rect.left
      const elementPosY = rect.top

      for (click of clickData) {
        const { posX, posY } = click

        const x = (elementWidth * posX) + elementPosX
        const y = (elementHeight * posY) + elementPosY

        cordinates.push({ posX: x, posY: y })
      }
    }
  }

  console.log(canOverlapElements)

  // FILTER PLOTS IN THE OVERLAPING AREAS
  const filteredCordinates = cordinates.filter((cordinate) => {
    return !isCordinateInside(cordinate, canOverlapElements)
  })


  // RE-COMPUTE PLOTS ADD THE OVERLAP ELEMENTS THAT WASN'T INCLUDE 
  for (const overlapingElement of canOverlapElements) {
    const { idCssSelector, clickData } = GLOBAL_MOUSE_DATA[overlapingElement.elementKey]

    if (clickData.length && idCssSelector) {
      const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))

      if (!element) continue

      const rect = element.getBoundingClientRect()

      const elementWidth = element.scrollWidth
      const elementHeight = element.scrollHeight
      const elementPosX = rect.left
      const elementPosY = rect.top

      for (click of clickData) {
        const { posX, posY } = click

        const x = (elementWidth * posX) + elementPosX
        const y = (elementHeight * posY) + elementPosY

        filteredCordinates.push({ posX: x, posY: y })
      }
    }
  }

  filteredCordinates.forEach(cord => {
    const dot = document.createElement("div")

    const x = cord.posX
    const y = cord.posY

    dot.className = "dot"
    dot.style.position = "absolute"
    dot.style.width = "10px"
    dot.style.height = "10px"
    dot.style.borderRadius = "50%"
    dot.style.backgroundColor = "yellow"
    dot.style.border = "1px solid black"
    dot.style.top = y + "px"
    dot.style.left = x + "px"
    dot.style.zIndex = 9999

    document.body.appendChild(dot)
  })

  console.timeEnd("Plot")
}

const removePlots = () => {
  const elements = document.body.querySelectorAll(".dot")

  if (!elements.length) return

  for (const element of elements) {
    element.remove()
  }
}

const mouseData = trackMouse()