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

const convertCustomCssSelector = (cssSelector) => {
  if (!cssSelector) return null

  let newCssSelector = cssSelector

  const bracketsRegex = /\[(\d+)\]/g

  if (bracketsRegex.test(cssSelector)) {
    newCssSelector = cssSelector.replaceAll(bracketsRegex, "nth-child($1)");
  }

  return newCssSelector
}

const getSiblingIndex = (element) => {
  if (!element || !element.parentElement?.children) return 0

  let siblingIndex = 0


  for (let item of element.parentElement.children) {
    if (item.__heatmap_node_map_id__ === element.__heatmap_node_map_id__) {
      return siblingIndex
    }

    siblingIndex++
  }

  return siblingIndex
}

const getNodeName = (element) => {
  if (!element) return

  let nodeName = element.nodeName.toLowerCase()
  let siblingIndex = getSiblingIndex(element)

  return !siblingIndex ? nodeName : `${nodeName}:[${siblingIndex + 1}]`
}

const getParentsElements = (element) => {
  if (!element) return

  if (element.parentElement.nodeName === "BODY") {
    return "body"
  }

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

const pushMouseClickEventData = (event) => {
  const { offsetX, offsetY } = event

  const { __heatmap_node_map_id__, scrollHeight, scrollWidth } = event.target

  const nodeMapId = __heatmap_node_map_id__

  const posX = offsetX / scrollWidth
  const posY = offsetY / scrollHeight

  GLOBAL_MOUSE_DATA[nodeMapId].clickData.push({
    time: Date.now(),
    posX,
    posY
  })

  GLOBAL_MOUSE_DATA[nodeMapId].clicks++

  event.stopPropagation()
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

  elements.forEach((element) => {
    // Add the mouse event
    element.addEventListener("click", pushMouseClickEventData)
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

  return
};

const plotClicks = () => {
  const cordinates = []

  console.log(GLOBAL_MOUSE_DATA)

  for (const elementData in GLOBAL_MOUSE_DATA) {
    const { idCssSelector, clickData } = GLOBAL_MOUSE_DATA[elementData]

    if (clickData.length && idCssSelector) {
      console.log("🚀 ~ idCssSelector:", idCssSelector)
      const element = document.body.querySelector(convertCustomCssSelector(idCssSelector))
      const rect = element.getBoundingClientRect()
      console.log("🚀 ~ rect:", rect)

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

  cordinates.forEach(cord => {
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
}

const removePlots = () => {
  const elements = document.body.querySelectorAll(".dot")

  if (!elements.length) return

  for (const element of elements) {
    element.remove()
  }
}

const mouseData = trackMouse()