from typing import Optional
from colour import Color


def get_contrast_text_color(
    background_color: Optional[str], threshold: float = 0.5
) -> str:
    if not background_color:
        return "#ffffff"

    try:
        color = Color(background_color)

        luminance = color.luminance

        return "#000000" if luminance > threshold else "#ffffff"

    except Exception:
        return "#ffffff"
