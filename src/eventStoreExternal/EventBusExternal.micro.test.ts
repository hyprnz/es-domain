import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventBuilder} from "./ExternalEventBuilder";
import {Thespian, TMocked} from "thespian";
import {EventBusExternal} from "./EventBusExternal";
import {EventBusProcessor} from "../eventSourcing/EventBusProcessor";

describe("EventBusExternal", () => {
    let processor: TMocked<EventBusProcessor<ExternalEvent>>
    let bus: EventBusExternal
    let thespian: Thespian
    const handler = async (events: ExternalEvent[]): Promise<void> => {
    }
    beforeEach(() => {
        thespian = new Thespian()
        processor = thespian.mock()
        bus = new EventBusExternal(processor.object)
    })

    describe("callHandlers", () => {
        const event: ExternalEvent = ExternalEventBuilder.make().to()
        it("single event multiple times", async () => {
            processor.setup(x => x.registerHandlerForEvents(handler))
            processor.setup(x => x.callHandlers([event])).returns(() => Promise.resolve()).times(3)
            bus.registerHandlerForEvents(handler)
            await bus.callHandlers([event])
            await bus.callHandlers([event])
            await bus.callHandlers([event])
        })
        it("multiple events", async () => {
            processor.setup(x => x.registerHandlerForEvents(handler))
            processor.setup(x => x.callHandlers([event, event, event])).returns(() => Promise.resolve())
            bus.registerHandlerForEvents(handler)
            await bus.callHandlers([event, event, event])
        })
    })

})
