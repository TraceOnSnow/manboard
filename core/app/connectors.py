from typing import List, Protocol, runtime_checkable

from .models import Thread


@runtime_checkable
class Connector(Protocol):
    """Contract for external data source connectors.

    Implementations fetch items from a remote source (Obsidian, GitHub,
    Calendar, RSS, …) and return them as Thread objects. No real
    implementation ships in this change — the contract exists so future
    adapters have a stable interface to conform to.
    """

    def fetch(self) -> List[Thread]: ...
