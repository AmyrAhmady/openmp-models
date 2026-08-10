import React, { Component } from 'react';
import { View, TouchableOpacity, Text, FlatList, TextInput } from 'react-native';
import { themeSelect } from 'src/resources/theme';
import { ObjectInfo, SkinInfo, VehicleInfo } from 'src/types';
import { request } from 'src/utils/api';
import Row from '../Row';

interface Props {
    modelType: "vehicle" | "object" | "skin";
    onSelectItem: (model: any) => void;
}

interface States {
    list: any[],
    searchInputValue: string
}

export default class MenuDesktop extends Component<Props, States> {

    fullList: VehicleInfo[] | ObjectInfo[] | SkinInfo[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            list: [],
            searchInputValue: ''
        }
    }

    fetchModelList() {
        request<{ type: string }, { list: any[] }>('GET', 'api/list', {
            type: this.props.modelType
        })
            .then(response => {
                this.fullList = response.list;
                this.setState({ list: response.list });
            })
            .catch(error => {
                console.log(error);
            });
    }

    searchInModelList(query: string) {
        request<{ type: string, q: string }, { results: any[] }>('GET', 'api/search', {
            type: this.props.modelType,
            q: query
        })
            .then(response => {
                this.setState({ list: response.results });
            })
            .catch(error => {
                console.log(error);
            });
    }

    componentDidMount() {
        this.fetchModelList();
    }

    componentDidUpdate(prevProps: Props, prevState) {
        if (prevProps.modelType !== this.props.modelType) {
            this.fetchModelList();
        }
    }

    render() {

        const theme = themeSelect();

        const {
            onSelectItem
        } = this.props;

        const {
            list,
            searchInputValue
        } = this.state;

        return (
            <View
                style={{
                    width: '100%', height: '100%', backgroundColor: theme.elementBg,
                    borderRightWidth: 1, borderColor: theme.lines,
                }}
            >
                <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 14 }}>
                    <Text style={{ color: theme.title, fontSize: 19, fontWeight: '800' }}>Browse models</Text>
                    <Text style={{ color: theme.mutedText, fontSize: 13, marginTop: 5 }}>Choose a model to preview</Text>
                </View>
                <Row
                    style={{
                        height: 48, width: 'auto', marginHorizontal: 18, backgroundColor: theme.textBox,
                        direction: 'ltr', borderWidth: 1, borderColor: theme.lines, borderRadius: 10,
                        paddingHorizontal: 12,
                    }}
                    centerContainerStyle={{ flex: undefined }}
                    leftContainerStyle={{ height: '100%', flex: 1 }}
                    leftComponent={
                        <View style={{ width: '100%', paddingRight: 10 }}>
                            <TextInput
                                value={searchInputValue}
                                style={{
                                    height: 44, width: '100%', paddingHorizontal: 0, fontSize: 14, color: theme.normalText
                                }}
                                placeholder={"Search for a model by name or id"}
                                placeholderTextColor={theme.textBoxPlaceholder}
                                onChangeText={(text) => {
                                    this.setState({ searchInputValue: text })
                                    if (text.length) {
                                        this.searchInModelList(text);
                                    }
                                    else {
                                        this.setState({ list: this.fullList })
                                    }
                                }}
                            />
                        </View>
                    }
                    rightContainerStyle={{ height: '100%', flex: undefined }}
                    rightComponent={
                        <TouchableOpacity
                            onPress={() => {
                                this.setState({ searchInputValue: '' });
                                this.setState({ list: this.fullList });
                            }}
                        >
                            <Text style={{ fontSize: 22, color: theme.mutedText }}>×</Text>
                        </TouchableOpacity>
                    }
                />
                <FlatList
                    style={{ height: '100%', marginTop: 14 }}
                    contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 20, direction: 'ltr' }}
                    data={list}
                    renderItem={({ item, index }) => {
                        return (
                            <TouchableOpacity
                                key={index}
                                style={{ paddingHorizontal: 6, marginBottom: 4 }}
                                onPress={() => {
                                    if (onSelectItem) {
                                        onSelectItem(item);
                                    }
                                }}
                            >
                                <View
                                    style={{
                                        width: '100%', alignItems: 'center',
                                        paddingVertical: 13, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between',
                                        borderRadius: 9,
                                    }}
                                >
                                    <Text style={{ color: theme.normalText, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
                                    <Text style={{ color: theme.mutedText, fontSize: 12, fontWeight: '700' }}>{item.id}</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    }}
                />
            </View >
        );
    }
}
