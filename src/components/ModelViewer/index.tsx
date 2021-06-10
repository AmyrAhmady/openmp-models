import React, { Component } from "react";
import { ModelData } from "./types";
import Scene from "./Scene";

export default class ModelViewer extends Component<{
    models: ModelData[],
    autoSpin: boolean,
    backgroundColor: string
}> {

    static defaultProps = {
        model: [{
            type: 'object',
            name: 'model',
            obj: [],
            textures: []
        }],
        autoSpin: false,
        backgroundColor: "transparent",
    };

    rootElementRef: HTMLDivElement | null = null;
    scene: Scene | null = null;

    constructor(props: any) {
        super(props);
        this.scene = new Scene(props.models, props.autoSpin);
    }

    componentDidMount() {
        this.scene?.init(this.rootElementRef);
    }

    render() {
        return (
            <div
                ref={(element) => (this.rootElementRef = element)}
                style={{
                    height: "100%",
                    width: "100%",
                    backgroundColor: this.props.backgroundColor,
                }}
            />
        );
    }
}
